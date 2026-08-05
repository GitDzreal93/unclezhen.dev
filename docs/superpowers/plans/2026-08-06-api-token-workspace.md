# API Token 工作区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 API Token 后台改造成带可读 API 文档与同源 Markdown 导出的双栏工作区。

**Architecture:** `docs/api.md` 是唯一文档来源。服务端读取它、用现有净化器渲染 HTML，并同时传给客户端原始 Markdown；客户端只负责现有 Token 操作与 Blob 下载。Docker runner 携带 `docs/`，使 standalone 部署可读取文档。

**Tech Stack:** Next.js App Router、React 19、TypeScript、marked、isomorphic-dompurify、Puppeteer Core、CSS Grid。

---

### Task 1: 写宽屏布局与下载的失败回归测试

**Files:**
- Create: `scripts/verify-api-token-workspace.mjs`
- Modify: `package.json`

- [ ] **Step 1: 创建测试脚本**

复用 `scripts/verify-posts-import.mjs` 中读取 `.env.local`、启动 Puppeteer、登录后台的逻辑。脚本必须在 `1440 × 1000` 打开 `/admin/api-tokens`，并使用以下断言：

```js
check("API Token 页面含双栏工作区", await page.$(".api-workspace"));
check("文档包含端点表", await page.$(".api-docs table"));
check("文档包含代码块", await page.$(".api-docs pre"));
const columns = await page.$eval(".api-workspace", (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
check("宽屏使用两栏", columns === 2, columns);
```

为下载测试创建临时目录并配置 CDP，然后点击按钮并读取文件：

```js
const downloadDir = await mkdtemp(join(tmpdir(), "zhen-api-docs-"));
const client = await page.target().createCDPSession();
await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
await page.click("[data-api-doc-download]");
await page.waitForFunction(() => document.querySelector("[data-api-doc-download]")?.getAttribute("data-downloaded") === "true");
const markdown = await readFile(join(downloadDir, "public-content-api.md"), "utf8");
check("导出的 Markdown 含鉴权说明", markdown.includes("## 鉴权与权限"));
await rm(downloadDir, { recursive: true, force: true });
```

在 `package.json` 添加：

```json
"verify:api-workspace": "node scripts/verify-api-token-workspace.mjs"
```

- [ ] **Step 2: 验证 RED**

Run: `npm run verify:api-workspace`

Expected: 退出码为 1，且“API Token 页面含双栏工作区”失败；先修复任何与新界面无关的登录或 Chrome 环境问题。

- [ ] **Step 3: 提交测试基线**

Run:

```bash
git add scripts/verify-api-token-workspace.mjs package.json
git commit -m "test: cover API token workspace"
```

### Task 2: 建立服务端文档加载边界

**Files:**
- Create: `src/lib/api-documentation.ts`
- Modify: `src/app/admin/api-tokens/page.tsx`
- Modify: `Dockerfile`

- [ ] **Step 1: 创建只在服务端运行的加载器**

```ts
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type ApiDocumentation =
  | { available: true; markdown: string }
  | { available: false; markdown: "" };

export async function getApiDocumentation(): Promise<ApiDocumentation> {
  try {
    const markdown = await readFile(join(process.cwd(), "docs", "api.md"), "utf8");
    return { available: true, markdown };
  } catch {
    return { available: false, markdown: "" };
  }
}
```

- [ ] **Step 2: 在页面加载并净化文档**

在 `src/app/admin/api-tokens/page.tsx` 导入 `getApiDocumentation`、`renderMarkdown`；将其加入现有 `Promise.all`，并按如下方式传 props：

```tsx
const documentHtml = documentation.available ? renderMarkdown(documentation.markdown) : "";
return <ApiTokenManager
  tokens={tokens.map((token) => ({
    id: token.id,
    name: token.name,
    prefix: token.prefix,
    scopes: token.scopes,
    expiresAt: token.expires_at?.toISOString() ?? null,
    revokedAt: token.revoked_at?.toISOString() ?? null,
    lastUsedAt: token.last_used_at?.toISOString() ?? null,
  }))}
  locale={locale}
  documentation={{ available: documentation.available, markdown: documentation.markdown, html: documentHtml }}
/>;
```

- [ ] **Step 3: 让 Docker runner 携带唯一 Markdown 源**

在 `Dockerfile` runner 阶段、`COPY --from=builder /app/public ./public` 后增加：

```dockerfile
# API Token 后台在运行时从 docs/api.md 渲染并导出接口文档。
COPY --from=builder /app/docs ./docs
```

### Task 3: 实现工作区、文档渲染与下载

**Files:**
- Modify: `src/app/admin/api-tokens/ApiTokenManager.tsx`
- Modify: `src/app/admin/admin.css`

- [ ] **Step 1: 定义文档 prop 与下载行为**

在客户端组件顶部新增：

```ts
type Documentation = { available: boolean; markdown: string; html: string };
```

将 `documentation: Documentation` 加入组件 props，并加入：

```ts
function downloadDocumentation() {
  const blob = new Blob([documentation.markdown], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "public-content-api.md";
  link.click();
  URL.revokeObjectURL(href);
}
```

- [ ] **Step 2: 将现有三段 Token UI 放进左栏并增加 `aside`**

保留创建、密钥提示、列表、撤销和删除逻辑，把现有三个 `.settings-card` 放入 `.api-workspace__tokens`，并添加：

```tsx
<aside className="api-docs" aria-labelledby="api-docs-title">
  {documentation.available ? <>
    <header className="api-docs__head">
      <div><span className="eyebrow">Reference / v1</span><h2 id="api-docs-title">Public Content API</h2></div>
      <button className="btn btn--ghost btn--sm" type="button" data-api-doc-download onClick={(event) => { downloadDocumentation(); event.currentTarget.dataset.downloaded = "true"; window.setTimeout(() => delete event.currentTarget.dataset.downloaded, 800); }}>导出 .md</button>
    </header>
    <nav className="api-docs__nav" aria-label="接口文档章节"><a href="#鉴权与权限">鉴权</a><a href="#端点">端点</a><a href="#数据字段">字段</a><a href="#示例">示例</a><a href="#错误格式">错误码</a></nav>
    <div className="api-docs__body" dangerouslySetInnerHTML={{ __html: documentation.html }} />
  </> : <div className="api-docs__unavailable"><h2 id="api-docs-title">接口文档暂不可用</h2><p>Token 管理不受影响；请检查部署是否包含 docs/api.md。</p></div>}
</aside>
```

- [ ] **Step 3: 添加两栏节奏与可读 Markdown 样式**

追加这些规则，且不修改 `.admin-shell`：

```css
.api-workspace { display:grid; grid-template-columns:minmax(420px, .9fr) minmax(500px, 1.1fr); gap:18px; align-items:start; }
.api-workspace__tokens { display:grid; gap:16px; min-width:0; }.api-workspace__tokens .settings-card { margin:0; }
.api-docs { position:sticky; top:16px; max-height:calc(100vh - 32px); overflow:auto; border:1px solid var(--border); border-radius:var(--radius); background:color-mix(in oklch, var(--surface) 88%, var(--surface-2)); }
.api-docs__head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 16px 12px; border-bottom:1px solid var(--border); }.api-docs__head h2 { margin:0; font:600 15px/1.2 var(--font-display); }
.api-docs__nav { display:flex; gap:6px; flex-wrap:wrap; padding:10px 16px; border-bottom:1px solid var(--border); }.api-docs__nav a { padding:3px 6px; border-radius:3px; color:var(--muted); font:10px var(--font-mono); }.api-docs__nav a:hover { background:var(--surface-2); color:var(--accent); }
.api-docs__body { padding:16px; }.api-docs__body h2 { margin:22px 0 8px; font:600 13px/1.25 var(--font-display); }.api-docs__body h3 { margin:16px 0 6px; font-size:12px; }.api-docs__body p,.api-docs__body ul { margin:0 0 10px; }.api-docs__body table { width:100%; margin:12px 0; border-collapse:collapse; font-size:11px; }.api-docs__body th,.api-docs__body td { padding:7px 8px; border:1px solid var(--border); text-align:left; vertical-align:top; }.api-docs__body pre { margin:12px 0; padding:11px; overflow:auto; border-left:2px solid var(--accent); background:var(--bg); font:10.5px/1.55 var(--font-mono); }.api-docs__body code { font-family:var(--font-mono); }.api-docs__unavailable { padding:18px; }
@media (max-width:1100px) { .api-workspace { grid-template-columns:1fr; }.api-docs { position:static; max-height:none; }.api-workspace__tokens { gap:14px; } }
```

- [ ] **Step 4: 验证 GREEN**

Run: `npm run verify:api-workspace`

Expected: 退出码为 0，双栏、表格、代码块和 Markdown 下载均通过。

- [ ] **Step 5: 提交功能**

Run:

```bash
git add src/lib/api-documentation.ts src/app/admin/api-tokens/page.tsx src/app/admin/api-tokens/ApiTokenManager.tsx src/app/admin/admin.css Dockerfile
git commit -m "feat: add API token documentation workspace"
```

### Task 4: 补充窄屏验证并做完整构建

**Files:**
- Modify: `scripts/verify-api-token-workspace.mjs`

- [ ] **Step 1: 在测试中加入 900px 堆叠断言**

```js
await page.setViewport({ width: 900, height: 900 });
await page.reload({ waitUntil: "networkidle0" });
const mobile = await page.$eval(".api-workspace", (el) => ({
  columns: getComputedStyle(el).gridTemplateColumns.split(" ").length,
  docsPosition: getComputedStyle(document.querySelector(".api-docs")).position,
}));
check("窄屏堆叠文档面板", mobile.columns === 1 && mobile.docsPosition === "static", JSON.stringify(mobile));
```

- [ ] **Step 2: 运行完整验证**

Run: `npm run verify:api-workspace && npm run build`

Expected: 两个命令均以退出码 0 完成；浏览器检查宽屏、下载、窄屏，构建输出包含 `/admin/api-tokens`。

- [ ] **Step 3: 提交验证脚本**

Run:

```bash
git add scripts/verify-api-token-workspace.mjs
git commit -m "test: verify responsive API docs workspace"
```
