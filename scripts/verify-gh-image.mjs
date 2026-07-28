// End-to-end verification of the GitHub image-host pipeline.
// Uploads a real (tiny) PNG to the configured repo via the Contents API,
// then probes several CDN mirrors to confirm which actually serve it.
// Cleans the probe file up afterwards so the repo stays tidy.
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const cfg = {};
for (const line of env.split("\n")) {
  const m = line.match(/^\s*(GH_IMG_\w+)\s*=\s*(.*)\s*$/);
  if (m) cfg[m[1]] = m[2].trim();
}
const { GH_IMG_TOKEN, GH_IMG_USER, GH_IMG_REPO, GH_IMG_BRANCH, GH_IMG_DIR } = cfg;
for (const k of ["GH_IMG_TOKEN", "GH_IMG_USER", "GH_IMG_REPO", "GH_IMG_BRANCH", "GH_IMG_DIR"]) {
  if (!cfg[k]) {
    console.error(`✖ .env.local 缺少 ${k}`);
    process.exit(1);
  }
}
console.log(`repo: ${GH_IMG_USER}/${GH_IMG_REPO}@${GH_IMG_BRANCH}  dir: ${GH_IMG_DIR}/`);
console.log(`token: ${GH_IMG_TOKEN.slice(0, 4)}…${GH_IMG_TOKEN.slice(-3)} (masked)\n`);

// 1x1 red PNG — dependency-free valid image payload.
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const stamp = Date.now().toString(36);
const filename = `verify-${stamp}.png`;
const remotePath = `${GH_IMG_DIR}/${filename}`;
const apiURL = `https://api.github.com/repos/${GH_IMG_USER}/${GH_IMG_REPO}/contents/${remotePath}`;
const headers = {
  Authorization: `Bearer ${GH_IMG_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const log = (ok, msg) => console.log(`${ok ? "✅" : "❌"} ${msg}`);

// ---- 1. upload ----
const putRes = await fetch(apiURL, {
  method: "PUT",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    message: `verify: ${filename}`,
    content: PNG_B64,
    branch: GH_IMG_BRANCH,
  }),
});
let sha = null;
if (putRes.ok) {
  const j = await putRes.json();
  sha = j.content?.sha;
  log(true, `上传成功 → ${remotePath}  (HTTP ${putRes.status})`);
} else {
  log(false, `上传失败 HTTP ${putRes.status}: ${(await putRes.text()).slice(0, 200)}`);
  process.exit(1);
}

// ---- 2. probe CDN mirrors ----
// jsDelivr caches ~12h; hitting purge first forces a fresh pull for the test.
const probes = [
  ["purge (强制刷新缓存)", `https://purge.jsdelivr.net/gh/${GH_IMG_USER}/${GH_IMG_REPO}@${GH_IMG_BRANCH}/${remotePath}`],
  ["cdn.jsdelivr.net", `https://cdn.jsdelivr.net/gh/${GH_IMG_USER}/${GH_IMG_REPO}@${GH_IMG_BRANCH}/${remotePath}`],
  ["fastly.jsdelivr.net", `https://fastly.jsdelivr.net/gh/${GH_IMG_USER}/${GH_IMG_REPO}@${GH_IMG_BRANCH}/${remotePath}`],
  ["gcore.jsdelivr.net", `https://gcore.jsdelivr.net/gh/${GH_IMG_USER}/${GH_IMG_REPO}@${GH_IMG_BRANCH}/${remotePath}`],
  ["raw.githubusercontent", `https://raw.githubusercontent.com/${GH_IMG_USER}/${GH_IMG_REPO}/${GH_IMG_BRANCH}/${remotePath}`],
];
console.log("\n镜像可用性（HTTP 码 / 耗时 / 类型）：");
const usable = [];
for (const [name, url] of probes) {
  try {
    const r = await fetch(url);
    const ok = r.ok;
    const ct = r.headers.get("content-type") || "—";
    if (ok && name !== "purge (强制刷新缓存)") usable.push(name);
    console.log(`  ${ok ? "✅" : "❌"} ${name.padEnd(22)} ${String(r.status).padEnd(5)} ${r.headers.get("content-length") || "?"}B  ${ct}`);
  } catch (e) {
    console.log(`  ❌ ${name.padEnd(22)} 网络错误: ${e.message}`);
  }
}

// ---- 3. cleanup ----
const delRes = await fetch(`${apiURL}?ref=${GH_IMG_BRANCH}`, {
  method: "DELETE",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ message: `verify cleanup: ${filename}`, sha, branch: GH_IMG_BRANCH }),
});
log(delRes.ok, `清理测试文件 (HTTP ${delRes.status})`);

console.log(`\n可用镜像: ${usable.length ? usable.join(" · ") : "（无）"}`);
process.exit(0);
