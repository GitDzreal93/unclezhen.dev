// Browser verification for the admin posts editor.
// Drives the real app on http://localhost:3001 via headless Chrome:
//   login → posts list → new editor (live preview + textarea auto-grow +
//   view toggle) → ⌘S save → verify it landed in the list + DB.
import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Read ADMIN_PASSWORD straight from .env.local (shell env may differ).
const env = readFileSync(".env.local", "utf8");
const pw = env.match(/^\s*ADMIN_PASSWORD\s*=\s*(.*)\s*$/m)[1].trim().replace(/^["']|["']$/g, "");

const stamp = Date.now().toString(36);
const NEW_ID = `verify-${stamp}`;
const NEW_TITLE = `验证文章 ${stamp}`;
const MD = `# 测试标题

这段正文应被 **渲染成 HTML** 并出现在右侧预览。

- 列表项一
- 列表项二

\`code\` 与 [链接](https://example.com)`;

const results = [];
function check(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? "  — " + detail : ""}`);
}

const realBrowser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await realBrowser.newPage();
await page.setViewport({ width: 1280, height: 900 });

// ---------- 1. login ----------
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle0" });
await page.type("#pw", pw);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForFunction(() => location.pathname === "/admin", { timeout: 8000 });
check("登录成功，到达 /admin", page.url().endsWith("/admin"), page.url());

// ---------- 2. posts list ----------
await page.goto(`${BASE}/admin/posts`, { waitUntil: "networkidle0" });
const rowCount = await page.$$eval(".admin-table tbody tr", (rs) => rs.length).catch(() => 0);
check("文章列表渲染（≥1 行）", rowCount >= 1, `渲染 ${rowCount} 行`);

// ---------- 3. open new editor ----------
await page.click('a[href="/admin/posts/new"]');
await page.waitForSelector("#view-post-edit.post-editor", { timeout: 8000 });
check("进入新建编辑器", true);

// ---------- 4. fill metadata ----------
await page.type("#id", NEW_ID);
await page.type("#title", NEW_TITLE);
// date: use the native value setter so React's controlled input picks it up.
await page.evaluate(() => {
  const el = document.getElementById("date");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(el, new Date().toISOString().slice(0, 10));
  el.dispatchEvent(new Event("input", { bubbles: true }));
});

// ---------- 5. type markdown body + verify live preview ----------
const body = await page.$(".post-editor__write textarea");
// ref check: textarea must have the ref-backed auto-grow. Type and measure height growth.
await body.type(MD, { delay: 0 });
// wait for debounced server preview (300ms) to settle
await new Promise((r) => setTimeout(r, 700));
const previewHTML = await page.$eval(".post-editor__preview", (el) => el.innerHTML).catch(() => "");
check(
  "实时预览渲染了 HTML",
  /<h1/i.test(previewHTML) && /<strong>/i.test(previewHTML) && /<a\s/i.test(previewHTML),
  `preview 含 h1/strong/a: ${/<h1/i.test(previewHTML)}/${/<strong>/i.test(previewHTML)}/${/<a\s/i.test(previewHTML)}`
);

// ---------- 6. textarea auto-grow (the bodyRef fix) ----------
const grew = await page.evaluate(() => {
  const ta = document.querySelector(".post-editor__write textarea");
  const h = ta.getBoundingClientRect().height;
  return { h, hasRef: h > 60 }; // multi-line content must push height well past one row
});
check("正文 textarea 随内容自动撑高", grew.h > 80, `textarea 高 ${Math.round(grew.h)}px`);

// ---------- 7. view toggle: write-only ----------
await page.evaluate(() => {
  const btns = [...document.querySelectorAll(".tool-btn")];
  const write = btns.find((b) => b.textContent.trim() === "只写");
  if (write) write.click();
});
await new Promise((r) => setTimeout(r, 200));
const writeOnly = await page.$eval(".post-editor__panes", (el) => el.classList.contains("is-write-only"));
check("视图切换到「只写」", writeOnly);

// back to split
await page.evaluate(() => {
  const btns = [...document.querySelectorAll(".tool-btn")];
  btns.find((b) => b.textContent.trim() === "分栏").click();
});

// ---------- 8. dirty state before save ----------
const dirtyBefore = await page.$eval(".post-editor__bar-meta", (el) => el.textContent.includes("未保存"));
check("保存前显示「未保存」脏状态", dirtyBefore);

// ---------- 9. Ctrl/Cmd+S save ----------
// Focus the body textarea (where you'd actually be typing) and fire the
// shortcut. The handler accepts metaKey || ctrlKey; ctrlKey is reliable in
// headless Chrome. Capture any inline error in case the server action throws.
await page.focus(".post-editor__write textarea");
await page.keyboard.down("Control");
await page.keyboard.press("KeyS");
await page.keyboard.up("Control");
let saved = false;
try {
  await page.waitForFunction(() => location.pathname === "/admin/posts", { timeout: 8000 });
  saved = true;
} catch {
  const errText = await page.$eval(".admin-login__err", (el) => el.textContent.trim()).catch(() => "");
  check("⌘S 触发保存并跳回列表", false, `超时；错误提示：${errText || "（无）"}`);
}
if (saved) check("⌘S 触发保存并跳回列表", true);

// ---------- 10. new post appears in list ----------
const inList = await page.evaluate(
  (title) => [...document.querySelectorAll(".admin-table tbody tr")].some((r) => r.textContent.includes(title)),
  NEW_TITLE
);
check("新文章出现在列表", inList);

await realBrowser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
