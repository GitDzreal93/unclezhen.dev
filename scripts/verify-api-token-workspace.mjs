import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.env.ADMIN_BASE_URL ?? "http://localhost:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const env = readFileSync(".env.local", "utf8");
const password = env.match(/^\s*ADMIN_PASSWORD\s*=\s*(.*)\s*$/m)?.[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");

if (!password) throw new Error("ADMIN_PASSWORD is missing from .env.local");

const results = [];
function check(name, value, detail = "") {
  const ok = Boolean(value);
  results.push({ name, ok });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#pw", { timeout: 8000 });
  await page.type("#pw", password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForFunction(() => location.pathname === "/admin", { timeout: 8000 });
  await page.goto(`${BASE}/admin/api-tokens`, { waitUntil: "domcontentloaded" });

  const workspace = await page.$(".api-workspace");
  check("API Token 页面含双栏工作区", workspace);
  check("文档包含端点表", await page.$(".api-docs table"));
  check("文档包含代码块", await page.$(".api-docs pre"));

  if (workspace) {
    const columns = await page.$eval(".api-workspace", (el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    check("宽屏使用两栏", columns === 2, `${columns} columns`);
  }

  const downloadButton = await page.$("[data-api-doc-download]");
  check("提供 Markdown 导出按钮", downloadButton);
  if (downloadButton) {
    const documentText = await page.$eval(".api-docs__body", (body) => body.textContent ?? "");
    check("导出源文档含鉴权说明", documentText.includes("鉴权与权限"));
  }

  await page.setViewport({ width: 900, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });
  const mobile = await page.$eval(".api-workspace", (el) => ({
    columns: getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
    docsPosition: getComputedStyle(document.querySelector(".api-docs")).position,
  }));
  check("窄屏堆叠文档面板", mobile.columns === 1 && mobile.docsPosition === "static", JSON.stringify(mobile));
} finally {
  await browser.close();
}

const failures = results.filter((result) => !result.ok);
console.log(`\n${results.length - failures.length}/${results.length} 通过`);
process.exitCode = failures.length ? 1 : 0;
