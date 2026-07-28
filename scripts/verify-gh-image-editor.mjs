// Browser verification of the full image-host pipeline through the real UI.
// login → media (empty) → posts editor → click 图片 → upload /tmp/verify-upload.png
// → Markdown inserted → preview renders <img> → jsDelivr URL reachable (curl)
// → DB row exists → cleanup (DB + GitHub repo).
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer-core";
import pg from "pg";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_IMG = "/tmp/verify-upload.png";

const env = readFileSync(".env.local", "utf8");
const kv = {};
for (const line of env.split("\n")) {
  const m = line.match(/^\s*(GH_IMG_\w+|ADMIN_PASSWORD|POSTGRES_DSN)\s*=\s*(.*)\s*$/);
  if (m) kv[m[1]] = m[2].trim();
}

const results = [];
const check = (n, c, d = "") => {
  results.push({ n, ok: !!c });
  console.log(`${c ? "✅" : "❌"} ${n}${d ? "  — " + d : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

// 1. login
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle0" });
await page.type("#pw", kv.ADMIN_PASSWORD);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForFunction(() => location.pathname === "/admin", { timeout: 8000 });

// 2. media empty state
await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle0" });
const emptyMedia = await page.$eval(".admin-empty__title", (el) => el.textContent).catch(() => "");
check("媒体库空态正常", /还没有素材/.test(emptyMedia));

// 3. open editor + upload via the 图片 button's hidden file input
await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "networkidle0" });
await page.waitForSelector(".post-editor__write textarea");
const input = await page.$('input[type=file]');
await input.uploadFile(TEST_IMG);

// wait for the markdown image tag to appear in the body textarea
let url = null;
try {
  await page.waitForFunction(
    () => /!\[.*\]\(https:\/\/.+\/img\/.+\)/.test(document.querySelector(".post-editor__write textarea").value),
    { timeout: 10000 }
  );
  const body = await page.$eval(".post-editor__write textarea", (el) => el.value);
  url = body.match(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/)?.[1];
  check("上传后 Markdown 图片标签插入正文", !!url, url ? url.slice(0, 60) + "…" : "未找到 URL");
} catch {
  check("上传后 Markdown 图片标签插入正文", false, "超时");
}

// 4. preview renders an <img> pointing at the CDN
if (url) {
  await new Promise((r) => setTimeout(r, 900));
  const img = await page.$eval(".post-editor__preview img", (el) => ({ src: el.src, w: el.naturalWidth })).catch(() => null);
  check("预览区渲染了 <img>", !!img && img.src === url, img ? `naturalWidth=${img.w}` : "无 img");
}

await browser.close();

// 5. CDN reachability via curl (authoritative; browser IPv6 can be flaky here)
if (url) {
  let cdn = "";
  try {
    cdn = execSync(`curl -s -o /dev/null -w "%{http_code} %{content_type}" --max-time 8 "${url}"`, {
      encoding: "utf8",
    }).trim();
  } catch {
    cdn = "curl 失败";
  }
  check("jsDelivr 链接可访问", /^200 image\//.test(cdn), cdn);
}

// 6. DB row
const pool = new pg.Pool({ connectionString: kv.POSTGRES_DSN });
const dbRow = await pool.query("SELECT id,host,path,filename FROM images WHERE filename='verify-upload.png' ORDER BY created_at DESC LIMIT 1");
check("images 表有对应记录", dbRow.rows.length >= 1, dbRow.rows[0] ? `${dbRow.rows[0].id} · host尾 ${dbRow.rows[0].host.slice(-22)}` : "无");

// 7. cleanup: DB + GitHub repo
await pool.query("DELETE FROM images WHERE filename='verify-upload.png'");
const ghToken = kv.GH_IMG_TOKEN;
const apiBase = `https://api.github.com/repos/${kv.GH_IMG_USER}/${kv.GH_IMG_REPO}/contents`;
const listRes = await fetch(`${apiBase}/${kv.GH_IMG_DIR}?ref=${kv.GH_IMG_BRANCH}`, {
  headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json" },
});
// walk month dirs to find verify-upload-* files and delete them
let deleted = 0;
if (listRes.ok) {
  const top = await listRes.json();
  const monthDirs = top.filter((e) => e.type === "dir").map((e) => e.path);
  for (const monthDir of [`${kv.GH_IMG_DIR}/${new Date().toISOString().slice(0, 7).replace("-", "")}`]) {
    const r = await fetch(`${apiBase}/${monthDir}?ref=${kv.GH_IMG_BRANCH}`, {
      headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) continue;
    const files = await r.json();
    for (const f of files.filter((x) => x.type === "file" && /verify-upload/.test(x.name))) {
      await fetch(`${apiBase}/${f.path}?ref=${kv.GH_IMG_BRANCH}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ message: `verify cleanup: ${f.name}`, sha: f.sha, branch: kv.GH_IMG_BRANCH }),
      });
      deleted++;
    }
  }
}
check("清理测试图（DB + GitHub）", deleted >= 1, `GitHub 删 ${deleted} 个文件`);
await pool.end();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
