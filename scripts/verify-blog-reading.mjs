import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3003";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const articleTitle = "Markdown 全元素展示：用于阅读体验校准";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 2048, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/blog`, { waitUntil: "networkidle0" });

  await page.evaluate((title) => {
    const post = [...document.querySelectorAll(".post")]
      .find((element) => element.textContent?.includes(title));
    if (!post) throw new Error("目标文章未出现在列表中");
    post.click();
  }, articleTitle);

  await page.waitForFunction(() => Boolean(
    document.querySelector(".article-view article")
    && document.querySelector(".article-view .body"),
  ));
  const readingPage = await page.evaluate(() => {
    const article = document.querySelector(".article-view article");
    const markdown = document.querySelector(".article-view .body");
    const title = document.querySelector(".article-view h1");
    const terminal = markdown?.querySelector("pre");
    return {
      articleWidth: article?.getBoundingClientRect().width ?? 0,
      titleWidth: title?.getBoundingClientRect().width ?? 0,
      markdownH1Count: markdown?.querySelectorAll("h1").length ?? -1,
      markdownFontSize: markdown ? Number.parseFloat(getComputedStyle(markdown).fontSize) : 0,
      accent: getComputedStyle(document.querySelector(".blog-page")).getPropertyValue("--blog-accent"),
      terminalHeaderHeight: terminal
        ? Number.parseFloat(getComputedStyle(terminal, "::before").height) || 0
        : 0,
    };
  });

  assert.ok(readingPage.articleWidth > 0, "文章阅读区应在打开文章后稳定显示");
  assert.equal(readingPage.markdownH1Count, 0, "正文不应重复渲染文章标题");
  assert.ok(readingPage.articleWidth >= 780, "宽屏阅读区应有效使用至少 780px 的宽度");
  assert.ok(readingPage.titleWidth >= 800, "长标题应充分使用桌面阅读列宽，避免过早折行");
  assert.ok(readingPage.markdownFontSize <= 16, "宽屏正文应保持紧凑且舒适的 16px 字号");
  assert.match(readingPage.accent, /145/, "文章强调色应切换为绿色");
  assert.ok(readingPage.terminalHeaderHeight >= 34, "代码块应具有 iTerm2 风格的终端标题栏");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const mobileWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  assert.equal(mobileWidths.page, mobileWidths.viewport, "移动端阅读页不应横向溢出");
  console.log("Blog reading layout verification passed.");
} finally {
  await browser.close();
}
