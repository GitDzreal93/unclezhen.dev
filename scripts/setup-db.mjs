// Creates schema and seeds it from the prototype data.
// Run with: node scripts/setup-db.mjs
import pg from "pg";
import TurndownService from "turndown";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load POSTGRES_DSN from .env.local, overriding any inherited shell value
// so the seed always targets the project's configured database.
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.POSTGRES_DSN });

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Base tables (idempotent). Column additions and drops that migrate an existing
// database happen in MIGRATIONS below.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id           text PRIMARY KEY,
  title        text NOT NULL,
  date         date NOT NULL,
  tags         text[] NOT NULL DEFAULT '{}',
  excerpt      text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  sort         int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  type      text NOT NULL,
  year      text NOT NULL,
  blurb     text NOT NULL DEFAULT '',
  problem   text NOT NULL DEFAULT '',
  solution  text NOT NULL DEFAULT '',
  result    text NOT NULL DEFAULT '',
  stack     text[] NOT NULL DEFAULT '{}',
  role      text NOT NULL DEFAULT '',
  sort      int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id     text PRIMARY KEY,
  name   text NOT NULL,
  cat    text NOT NULL,
  price  int  NOT NULL,
  descr  text NOT NULL DEFAULT '',
  sort   int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cards (
  id          serial PRIMARY KEY,
  product_id  text NOT NULL,
  content     text NOT NULL,
  status      text NOT NULL DEFAULT 'unused',
  order_id    int,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cards_product_status_idx ON cards (product_id, status);

CREATE TABLE IF NOT EXISTS orders (
  id         serial PRIMARY KEY,
  email      text NOT NULL,
  items      jsonb NOT NULL DEFAULT '[]',
  total      int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  contact    text NOT NULL,
  message    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Image hosting: the asset itself lives in a GitHub repo (served via a CDN);
-- the DB only stores the link. host and path are split so the CDN origin can
-- be swapped later (UPDATE images SET host = ...) without touching paths.
CREATE TABLE IF NOT EXISTS images (
  id           text PRIMARY KEY,
  host         text NOT NULL,
  path         text NOT NULL,
  filename     text NOT NULL DEFAULT '',
  bytes        int  NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT '',
  alt          text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Public site navigation. One row per menu entry (home / blog / projects /
-- shop / game). The 'visible' column controls three display sites in sync:
--   - top nav bar in /home /blog /projects /shop (SiteNav)
--   - launcher left 'site map' list at / (LauncherStage)
--   - canvas game portals at / (GameClient)
-- Plus the /home module-card grid.
-- Presentation extras (hint text, canvas x/y/r/hue, module-card blurb) live
-- in code — see EXTRAS in LauncherStage / LAYOUT in GameClient / HINTS in
-- the admin NavTable. A nav_items row whose key has no presentation entry
-- is intentionally skipped from those consumers.
CREATE TABLE IF NOT EXISTS nav_items (
  key     text PRIMARY KEY,
  label   text NOT NULL,
  href    text NOT NULL,
  sort    int  NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true
);
`;


// Idempotent migrations: add virtual-goods columns to products, payment columns
// to orders, and drop the legacy courses/enrollments tables. Safe to re-run.
const MIGRATIONS = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'fixed';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fixed_content text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock int NOT NULL DEFAULT -1;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_trade_no text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qty int NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount int NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS trade_no text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_type text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_content text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_out_trade_no_idx ON orders (out_trade_no);

DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
`;

// Post bodies are authored/stored as HTML in the prototype; the platform now
// treats posts.body as Markdown. Convert on seed so the DB holds Markdown.
const POSTS_HTML = [
  { id: "webgl-ip", title: "用一张 PNG 做「伪 3D」IP 展示", date: "2026-06-12", tags: ["WebGL", "Three.js", "动效"], excerpt: "没有建模也能有舞台感：Plane + 光照 + 指针跟手，把手绘 IP 变成首页英雄区。", body: "<p>很多个人站首页直接贴头像，少了「进场」的感觉。臻叔的 IP 是手绘平面图，不必强上完整角色绑定，用 Three.js 的 <code>PlaneGeometry</code> 加一点光照与视差就够用。</p><h3>核心思路</h3><p>1）透明 PNG 作贴图；2）双面材质 + 背后暗板制造厚度；3）指针映射到旋转，拖拽覆盖自动漂浮；4）粒子与地面阴影补空间层次。</p><h3>性能</h3><p>限制 <code>devicePixelRatio ≤ 2</code>，页面不可见时停掉 rAF。低性能设备保留 2D fallback 即可。</p>" },
  { id: "design-tokens", title: "个人站的设计令牌：少即是多", date: "2026-05-28", tags: ["设计系统", "CSS"], excerpt: "六个语义色 + 三套字体，就能撑起博客、商店和课程页的一致性。", body: "<p>不要一上来堆 40 个 gray。个人站用 <code>--bg / --surface / --fg / --muted / --border / --accent</code> 就够。强调色每屏最多出现两次，避免「哪都在喊」。</p><h3>字体</h3><p>展示用 Sora，正文 IBM Plex Sans，代码 IBM Plex Mono。大标题负字距，全大写标签必须加 tracking。</p>" },
  { id: "course-funnel", title: "技术博主如何设计课程购买路径", date: "2026-04-03", tags: ["产品", "课程"], excerpt: "从「能学会什么」写起，而不是先贴价格。大纲、适合谁、学完能交付什么。", body: "<p>访客是开发者与学员，他们怕买到空话。课程卡上优先展示成果与课时结构，价格次之。结算原型要诚实：标注「演示下单」，别假装已接通支付。</p>" },
  { id: "react-bits", title: "从 React Bits 学组件动效的克制", date: "2026-03-18", tags: ["React", "动效"], excerpt: "背景与文字特效很炫，但产品页只需要一处决定性动效。", body: "<p>React Bits 适合灵感库，不适合整页搬空。首页英雄区给 3D IP，内页用过滤、卡片抬起、模态即可。动效服务导航与焦点，不为炫技而炫技。</p>" },
  { id: "ship-soft", title: "把 side project 卖出去的最小商店", date: "2026-02-09", tags: ["产品", "独立开发"], excerpt: "商品卡、筛选、购物车抽屉、结算确认——四步闭环比精美落地页更重要。", body: "<p>独立开发者商店先保证闭环：列表 → 详情/加购 → 结算 → 成功提示。库存与支付可后接。本站商店页就是这个最小可用原型。</p>" },
];

const POSTS = POSTS_HTML.map((p) => ({ ...p, body: turndown.turndown(p.body) }));

const PROJECTS = [
  { id: "ip-site", name: "臻叔个人站", type: "产品", year: "2026", blurb: "带 3D IP 英雄区的多职能个人站：博客、项目、课程与商店。", problem: "个人品牌站点往往只有简历列表，缺少记忆点与商业闭环。", solution: "以手绘 IP 做 Three.js 舞台，深色网格工坊气质，四条业务入口可独立演进。", result: "原型已覆盖响应式导航、内容筛选与购买流程示意。", stack: ["Three.js", "HTML/CSS", "原生 JS"], role: "设计 + 前端" },
  { id: "ops-dash", name: "内容运营台", type: "工具", year: "2025", blurb: "课程与文章发布节奏看板，支持筛选与状态流转。", problem: "多渠道内容排期散落在表格，状态不同步。", solution: "统一看板 + 标签过滤 + 状态 pill，给运营一目了然的本周焦点。", result: "看板覆盖本周发布节奏、标签筛选与状态流转三块。", stack: ["React", "TypeScript"], role: "前端负责人" },
  { id: "motion-kit", name: "动效组件包", type: "开源", year: "2025", blurb: "可复用的文字与背景动效，强调可访问与降级。", problem: "炫技组件难落地，性能与 reduced-motion 常被忽略。", solution: "每个组件带 fallback 与文档示例，默认尊重系统动效偏好。", result: "组件按按钮、文字、背景三组整理，每组均提供 reduced-motion 降级示例。", stack: ["React", "CSS", "Framer Motion"], role: "作者" },
  { id: "b2b-proto", name: "B2B 采购原型", type: "交付", year: "2024", blurb: "从询价到下单的多角色流程，桌面优先可点原型。", problem: "业务评审需要可点的全流程，而不是静态图。", solution: "分角色入口、表单校验、状态回执，减少评审会上的想象成本。", result: "原型打通报价、审批、订单、回执四个节点，可走完整流程。", stack: ["原型", "设计系统"], role: "交互 + 前端" },
  { id: "live-room", name: "直播课控台", type: "产品", year: "2024", blurb: "讲师侧控台：章节、问答、资料投放一体。", problem: "上课时窗口太多，讲师注意力被工具打断。", solution: "单屏分区：大纲、实时提问、资料库，快捷键提示。", result: "控台分大纲、实时提问、资料库三区，讲师单屏即可控场。", stack: ["WebRTC", "React"], role: "产品顾问 + 前端" },
  { id: "shop-tpl", name: "数字商品模板", type: "模板", year: "2023", blurb: "面向独立开发者的轻量商店模板，可二开。", problem: "卖源码/模板时搭建商店成本高。", solution: "商品卡、购物车、结算成功页一套打通，主题 token 可换。", result: "本站商店页即衍生形态。", stack: ["HTML", "JS"], role: "作者" },
];

// Products are virtual goods. Seed data uses 'fixed' delivery with a demo
// download link; card-mode products get their stock from the cards table.
const PRODUCTS = [
  { id: "tpl-personal", name: "个人站多页模板", cat: "模板", price: 129, descr: "首页 / 博客 / 项目 / 商店结构，含设计令牌。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/tpl-personal 提取码：demo", stock: -1 },
  { id: "kit-motion", name: "动效组件起步包", cat: "源码", price: 89, descr: "文字与卡片动效示例，带 reduced-motion。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/kit-motion 提取码：demo", stock: -1 },
  { id: "tool-md", name: "Markdown 发布小工具", cat: "软件", price: 59, descr: "本地预览 + 导出静态页的桌面小工具示意。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/tool-md 提取码：demo", stock: -1 },
  { id: "tpl-course", name: "课程落地页模板", cat: "模板", price: 79, descr: "大纲、适合谁、价格与报名表单一页打通。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/tpl-course 提取码：demo", stock: -1 },
  { id: "src-shop", name: "数字商品商店内核", cat: "源码", price: 199, descr: "购物车状态、筛选与结算弹层的可二开内核。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/src-shop 提取码：demo", stock: -1 },
  { id: "pack-brand", name: "深色品牌起步包", cat: "设计", price: 49, descr: "OKLch 令牌、字体配对与组件状态示意。", delivery_mode: "fixed", fixed_content: "下载链接：https://pan.example.com/pack-brand 提取码：demo", stock: -1 },
];

// Public site navigation. The launcher/game omit "about" by virtue of having
// no presentation entry for that key (see EXTRAS in LauncherStage, LAYOUT in
// GameClient). Keep the sort field authoritative for cross-consumer order.
//
// /about points to /home#about — it scrolls to the existing #about section
// on the home page rather than spawning a separate route.
const NAV_ITEMS = [
  { key: "home",     label: "/home",     href: "/home",          sort: 0 },
  { key: "blog",     label: "/blog",     href: "/blog",          sort: 1 },
  { key: "projects", label: "/projects", href: "/projects",      sort: 2 },
  { key: "shop",     label: "/shop",     href: "/shop",          sort: 3 },
  { key: "about",    label: "/about",    href: "/home#about",    sort: 4 },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA);
    await client.query(MIGRATIONS);

    for (let i = 0; i < POSTS.length; i++) {
      const p = POSTS[i];
      await client.query(
        `INSERT INTO posts (id,title,date,tags,excerpt,body,sort) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,date=EXCLUDED.date,tags=EXCLUDED.tags,excerpt=EXCLUDED.excerpt,body=EXCLUDED.body,sort=EXCLUDED.sort`,
        [p.id, p.title, p.date, p.tags, p.excerpt, p.body, i]
      );
    }
    for (let i = 0; i < PROJECTS.length; i++) {
      const p = PROJECTS[i];
      await client.query(
        `INSERT INTO projects (id,name,type,year,blurb,problem,solution,result,stack,role,sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,year=EXCLUDED.year,blurb=EXCLUDED.blurb,problem=EXCLUDED.problem,solution=EXCLUDED.solution,result=EXCLUDED.result,stack=EXCLUDED.stack,role=EXCLUDED.role,sort=EXCLUDED.sort`,
        [p.id, p.name, p.type, p.year, p.blurb, p.problem, p.solution, p.result, p.stack, p.role, i]
      );
    }
    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      await client.query(
        `INSERT INTO products (id,name,cat,price,descr,delivery_mode,fixed_content,stock,sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,cat=EXCLUDED.cat,price=EXCLUDED.price,descr=EXCLUDED.descr,delivery_mode=EXCLUDED.delivery_mode,fixed_content=EXCLUDED.fixed_content,stock=EXCLUDED.stock,sort=EXCLUDED.sort`,
        [p.id, p.name, p.cat, p.price, p.descr, p.delivery_mode, p.fixed_content, p.stock, i]
      );
    }
    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const n = NAV_ITEMS[i];
      await client.query(
        `INSERT INTO nav_items (key,label,href,sort,visible) VALUES ($1,$2,$3,$4,true)
         ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label,href=EXCLUDED.href,sort=EXCLUDED.sort`,
        [n.key, n.label, n.href, n.sort]
      );
    }
    // Drop any rows whose key is no longer in NAV_ITEMS (e.g. removing
    // "game" when a nav item is retired from the seed). Visible state is
    // NOT touched on the surviving rows.
    const keepKeys = NAV_ITEMS.map((n) => n.key);
    await client.query(
      "DELETE FROM nav_items WHERE key <> ALL($1::text[])",
      [keepKeys]
    );

    await client.query("COMMIT");
    console.log("✔ schema created, migrated and seeded");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("✖ setup failed:", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
