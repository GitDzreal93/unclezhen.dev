import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3003";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const articleTitle = "从“会聊天”到“能交付”：Agent 入门的第一条工作流";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 2048, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/blog`, { waitUntil: "networkidle0" });

  const firstPostTitle = await page.$eval(".post h3", (element) => element.textContent);
  assert.equal(firstPostTitle, articleTitle, "目标文章应显示在博客列表首位");
  await page.click(".post");

  await page.waitForFunction(() => Boolean(
    document.querySelector(".article-view article")
    && document.querySelector(".article-view .body"),
  ));
  const readingPage = await page.evaluate(() => {
    const article = document.querySelector(".article-view article");
    const markdown = document.querySelector(".article-view .body");
    return {
      articleWidth: article?.getBoundingClientRect().width ?? 0,
      markdownH1Count: markdown?.querySelectorAll("h1").length ?? -1,
    };
  });

  assert.ok(readingPage.articleWidth > 0, "文章阅读区应在打开文章后稳定显示");
  assert.equal(readingPage.markdownH1Count, 0, "正文不应重复渲染文章标题");
  assert.ok(readingPage.articleWidth >= 780, "宽屏阅读区应有效使用至少 780px 的宽度");

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
