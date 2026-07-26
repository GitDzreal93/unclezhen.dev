// Measure LogoPit "static jitter": launch headless Chrome via CDP, load /about,
// let the field settle, then sample the toolpit canvas frame-to-frame and report
// the mean per-pixel luma delta between consecutive settled frames.
// Usage: node scripts/measure-jitter.mjs [url]
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.argv[2] || "http://localhost:3000/about";
const SELECTOR = process.argv[3] || ".toolpit canvas";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;

const userDir = mkdtempSync(join(tmpdir(), "jitter-"));
const HEADFUL = process.env.HEADFUL === "1";
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDir}`,
  ...(HEADFUL ? [] : ["--headless=new", "--disable-gpu"]),
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1200,900",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome CDP did not come up");
}

// Minimal CDP client over the browser-level WebSocket, using Target flattened sessions.
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.sessionId = undefined;
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject, method } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function main() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  const cdp = new CDP(ws);

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  cdp.sessionId = sessionId;

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1200, height: 2200, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.send("Page.navigate", { url: URL });
  await sleep(1500);

  // Wait for the toolpit canvas to exist and have size.
  for (let i = 0; i < 40; i++) {
    const { result } = await cdp.send("Runtime.evaluate", {
      expression: `(() => { const c = document.querySelector('${SELECTOR}'); return c ? c.getBoundingClientRect().width : 0; })()`,
      returnByValue: true,
    });
    if (result.value > 0) break;
    await sleep(250);
  }

  // Get canvas viewport rect for clipped screenshots.
  // Scroll the canvas into view, then measure its rect in the current viewport.
  let rect;
  for (let i = 0; i < 20; i++) {
    const rectRes = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const c = document.querySelector('${SELECTOR}');
        if (!c) return "null";
        const r = c.getBoundingClientRect();
        return JSON.stringify({x:r.x+window.scrollX, y:r.y+window.scrollY, w:r.width, h:r.height});
      })()`,
      returnByValue: true,
    });
    const val = rectRes?.result?.value;
    if (val && val !== "null") { rect = JSON.parse(val); break; }
    await sleep(250);
  }
  if (!rect) throw new Error("could not resolve canvas rect");
  await sleep(400); // let scroll settle
  console.log("canvas rect:", rect);
  const clip = {
    x: Math.round(rect.x), y: Math.round(rect.y),
    width: Math.round(rect.w), height: Math.round(rect.h), scale: 1,
  };

  // Reusable frame capture + consecutive-frame luma-diff helper.
  async function captureSeries(n, gapMs) {
    const fr = [];
    for (let i = 0; i < n; i++) {
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png", clip, captureBeyondViewport: true, fromSurface: true,
      });
      fr.push(Buffer.from(data, "base64"));
      await sleep(gapMs);
    }
    return fr;
  }
  async function diffSeries(fr) {
    const ds = [];
    for (let i = 1; i < fr.length; i++) {
      const a = fr[i - 1].toString("base64");
      const b = fr[i].toString("base64");
      const { result } = await cdp.send("Runtime.evaluate", {
        awaitPromise: true, returnByValue: true,
        expression: `(async () => {
          const load = (b64) => new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.src = 'data:image/png;base64,' + b64; });
          const [ia, ib] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
          const w = ia.width, h = ia.height;
          const cv = new OffscreenCanvas(w, h); const cx = cv.getContext('2d');
          cx.drawImage(ia, 0, 0); const da = cx.getImageData(0,0,w,h).data;
          cx.drawImage(ib, 0, 0); const db = cx.getImageData(0,0,w,h).data;
          let sum = 0, cnt = 0;
          for (let p = 0; p < da.length; p += 4) {
            const la = 0.299*da[p]+0.587*da[p+1]+0.114*da[p+2];
            const lb = 0.299*db[p]+0.587*db[p+1]+0.114*db[p+2];
            sum += Math.abs(la - lb); cnt++;
          }
          return sum / cnt;
        })()`,
      });
      ds.push(Number(result.value.toFixed(3)));
    }
    return ds;
  }
  console.log("clip:", JSON.stringify(clip));

  // (1) MOVING baseline: capture immediately — the field is still falling/settling,
  // so a working animation MUST show non-zero frame diffs here. If this is ~0 too,
  // the harness isn't seeing animation (blank/paused) and no conclusion is valid.
  const movingFrames = await captureSeries(6, 120);
  const movingDiffs = await diffSeries(movingFrames);
  console.log("Frame-to-frame diff (MOVING, right after load):", JSON.stringify(movingDiffs));
  const movingAvg = movingDiffs.reduce((s, x) => s + x, 0) / movingDiffs.length;

  // (2) SETTLED: let physics settle undisturbed (no cursor input in headless).
  const SETTLE_MS = 13000;
  console.log(`Settling ${SETTLE_MS}ms...`);
  await sleep(SETTLE_MS);
  const frames = await captureSeries(6, 120);
  const diffs = await diffSeries(frames);
  console.log("Frame-to-frame diff (SETTLED):", JSON.stringify(diffs));
  const avg = diffs.reduce((s, x) => s + x, 0) / diffs.length;
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/logopit-frame.png", frames[0]);

  console.log(`\nMOVING avg: ${movingAvg.toFixed(3)}   SETTLED avg: ${avg.toFixed(3)}`);
  if (movingAvg < 0.5) {
    console.log("=> INCONCLUSIVE: no motion detected even right after load — harness isn't capturing animation (headless rAF paused / blank). Re-run headful.");
  } else if (avg < 0.5) {
    console.log("=> AT REST: animation ran (moving baseline non-zero) yet settled frames are static → jitter is GONE. ✅");
  } else if (avg < movingAvg * 0.25) {
    console.log(`=> MOSTLY SETTLED: residual motion ${(avg / movingAvg * 100).toFixed(0)}% of moving baseline.`);
  } else {
    console.log("=> STILL JITTERING: settled motion comparable to moving baseline. ❌");
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
