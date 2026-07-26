// Phase 2: (a) prove the previously-saved test post persisted to the DB,
// (b) exercise the rich-text paste-import flow in the browser, then
// (c) clean up every verify-* test post so no test data is left behind.
import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";
import pg from "pg";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const env = readFileSync(".env.local", "utf8");
const pw = env.match(/^\s*ADMIN_PASSWORD\s*=\s*(.*)\s*$/m)[1].trim().replace(/^["']|["']$/g, "");
const dsn = env.match(/^\s*POSTGRES_DSN\s*=\s*(.*)\s*$/m)[1].trim();

const results = [];
const check = (n, c, d = "") => {
  results.push({ n, ok: !!c });
  console.log(`${c ? "✅" : "❌"} ${n}${d ? "  — " + d : ""}`);
};

// ---- (a) DB: confirm a verify-* post exists ----
const pool = new pg.Pool({ connectionString: dsn });
const existing = await pool.query("SELECT id,title FROM posts WHERE id LIKE 'verify-%' ORDER BY id");
check("上次保存的测试文章已落库", existing.rows.length >= 1, `${existing.rows.length} 篇 verify-*`);

// ---- (b) browser: paste import ----
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle0" });
await page.type("#pw", pw);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForFunction(() => location.pathname === "/admin", { timeout: 8000 });

await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "networkidle0" });
await page.waitForSelector(".post-editor__write textarea");

// Open the import drawer and simulate a rich-text paste into it.
await page.evaluate(() => {
  [...document.querySelectorAll(".tool-btn")].find((b) => b.textContent.trim() === "导入").click();
});
await new Promise((r) => setTimeout(r, 150));
const imported = await page.evaluate(() => {
  const ta = document.getElementById("import");
  if (!ta) return { ok: false, why: "no import textarea" };
  const dt = new DataTransfer();
  dt.setData(
    "text/html",
    "<h2>导入小节</h2><p>这是带 <strong>加粗</strong> 和 <a href=\"https://x.test\">链接</a> 的富文本。</p><ul><li>项 A</li><li>项 B</li></ul>"
  );
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
  ta.dispatchEvent(ev);
  return { ok: true };
});

// The onPaste handler calls the server action (turndown) async; give it time,
// then read the body textarea to see if Markdown was appended.
await new Promise((r) => setTimeout(r, 1200));
const bodyMD = await page.$eval(".post-editor__write textarea", (el) => el.value);
check(
  "富文本粘贴被转成 Markdown 并追加到正文",
  /导入小节/.test(bodyMD) && /\*\*加粗\*\*/.test(bodyMD) && /\[链接\]/.test(bodyMD),
  imported.ok ? `正文含导入内容: ${/导入小节/.test(bodyMD)}/${/\*\*加粗\*\*/.test(bodyMD)}` : imported.why
);

await browser.close();

// ---- (c) cleanup: remove all verify-* test posts ----
const del = await pool.query("DELETE FROM posts WHERE id LIKE 'verify-%' RETURNING id");
check("清理测试文章", del.rows.length >= 1, `删除 ${del.rows.length} 篇: ${del.rows.map((r) => r.id).join(", ")}`);
await pool.end();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
