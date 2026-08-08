"use server";

import { revalidatePath } from "next/cache";
import { query } from "./db";
import { assertAdmin } from "./admin-auth";
import { renderMarkdown } from "./markdown";
import { generateApiToken, normalizeScopes } from "./api-tokens";

// All mutations funnel through here. Each asserts admin auth (middleware already
// guards /admin/* but server actions are directly invokable), then revalidates
// the affected public + admin routes.

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function int(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(str(v));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
// Split a comma/newline separated field into a clean string[].
function list(v: FormDataEntryValue | null): string[] {
  return str(v)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---- Public API tokens ----

export async function createApiToken(fd: FormData) {
  await assertAdmin();
  const name = str(fd.get("name"));
  if (!name) throw new Error("请输入 Token 名称");
  const scopes = normalizeScopes(fd.getAll("scopes"));
  const expiry = str(fd.get("expiresAt"));
  let expiresAt: Date | null = null;
  if (expiry) {
    expiresAt = new Date(expiry);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) throw new Error("过期时间必须晚于当前时间");
  }
  const generated = generateApiToken();
  await query(
    `INSERT INTO api_tokens (name,prefix,token_hash,scopes,expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [name, generated.prefix, generated.tokenHash, scopes, expiresAt],
  );
  revalidatePath("/admin/api-tokens");
  return { secret: generated.secret, prefix: generated.prefix };
}

export async function revokeApiToken(id: string) {
  await assertAdmin();
  await query("UPDATE api_tokens SET revoked_at=COALESCE(revoked_at,now()),updated_at=now() WHERE id=$1", [id]);
  revalidatePath("/admin/api-tokens");
}

export async function deleteApiToken(id: string) {
  await assertAdmin();
  await query("DELETE FROM api_tokens WHERE id=$1", [id]);
  revalidatePath("/admin/api-tokens");
}

// ---- Posts ----

export async function savePost(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  const title = str(fd.get("title"));
  const date = str(fd.get("date"));
  const tags = list(fd.get("tags"));
  const excerpt = str(fd.get("excerpt"));
  const body = str(fd.get("body")); // Markdown
  const sort = int(fd.get("sort"));
  if (!id || !title || !date) throw new Error("id、标题、日期必填");
  if (id === "series")
    throw new Error("文章 id 不能为 “series”（保留给合集路由 /blog/series）");
  await query(
    `INSERT INTO posts (id,title,date,tags,excerpt,body,sort) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,date=EXCLUDED.date,tags=EXCLUDED.tags,excerpt=EXCLUDED.excerpt,body=EXCLUDED.body,sort=EXCLUDED.sort`,
    [id, title, date, tags, excerpt, body, sort]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
}

export async function deletePost(id: string) {
  await assertAdmin();
  await query("DELETE FROM posts WHERE id=$1", [id]);
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
}

// Render a Markdown draft to sanitized HTML for the editor's live preview.
// Kept server-side so marked/DOMPurify never enter the client bundle.
export async function previewMarkdown(md: string): Promise<string> {
  await assertAdmin();
  return renderMarkdown(md ?? "");
}

// Convert pasted rich text (HTML) into Markdown for the editor's import flow.
export async function htmlToMarkdown(html: string): Promise<string> {
  await assertAdmin();
  // turndown is a dependency of the DB seed; load it lazily so it stays out of
  // the request path unless an admin actually imports rich text.
  const { default: TurndownService } = await import("turndown");
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  return td.turndown(html ?? "");
}

// ---- Projects ----

export async function saveProject(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  const name = str(fd.get("name"));
  const type = str(fd.get("type"));
  const year = str(fd.get("year"));
  if (!id || !name) throw new Error("id、名称必填");
  await query(
    `INSERT INTO projects (id,name,type,year,blurb,problem,solution,result,stack,role,sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,year=EXCLUDED.year,blurb=EXCLUDED.blurb,problem=EXCLUDED.problem,solution=EXCLUDED.solution,result=EXCLUDED.result,stack=EXCLUDED.stack,role=EXCLUDED.role,sort=EXCLUDED.sort`,
    [
      id,
      name,
      type,
      year,
      str(fd.get("blurb")),
      str(fd.get("problem")),
      str(fd.get("solution")),
      str(fd.get("result")),
      list(fd.get("stack")),
      str(fd.get("role")),
      int(fd.get("sort")),
    ]
  );
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: string) {
  await assertAdmin();
  await query("DELETE FROM projects WHERE id=$1", [id]);
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

// ---- Products ----

export async function saveProduct(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  const name = str(fd.get("name"));
  const cat = str(fd.get("cat"));
  const price = int(fd.get("price"));
  const descr = str(fd.get("descr"));
  const deliveryMode = str(fd.get("deliveryMode")) === "card" ? "card" : "fixed";
  const fixedContent = str(fd.get("fixedContent"));
  // For card mode, stock is derived from the cards table, so persist -1 (unused).
  const stock = deliveryMode === "card" ? -1 : int(fd.get("stock"), -1);
  const sort = int(fd.get("sort"));
  if (!id || !name) throw new Error("id、名称必填");
  await query(
    `INSERT INTO products (id,name,cat,price,descr,delivery_mode,fixed_content,stock,sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,cat=EXCLUDED.cat,price=EXCLUDED.price,descr=EXCLUDED.descr,delivery_mode=EXCLUDED.delivery_mode,fixed_content=EXCLUDED.fixed_content,stock=EXCLUDED.stock,sort=EXCLUDED.sort`,
    [id, name, cat, price, descr, deliveryMode, fixedContent, stock, sort]
  );
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await assertAdmin();
  await query("DELETE FROM products WHERE id=$1", [id]);
  await query("DELETE FROM cards WHERE product_id=$1 AND status='unused'", [id]);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

// ---- Cards ----

export async function addCards(fd: FormData) {
  await assertAdmin();
  const productId = str(fd.get("productId"));
  const bulk = str(fd.get("cards"));
  if (!productId) throw new Error("请选择商品");
  const lines = bulk
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("请粘贴至少一条卡密");
  // Batch insert one row per line.
  const values: string[] = [];
  const params: unknown[] = [];
  lines.forEach((content, i) => {
    values.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
    params.push(productId, content);
  });
  await query(
    `INSERT INTO cards (product_id, content) VALUES ${values.join(",")}`,
    params
  );
  revalidatePath("/shop");
  revalidatePath("/admin/cards");
  revalidatePath("/admin/products");
}

export async function deleteCard(id: number) {
  await assertAdmin();
  // Only unused cards are deletable; sold cards are part of order history.
  await query("DELETE FROM cards WHERE id=$1 AND status='unused'", [id]);
  revalidatePath("/shop");
  revalidatePath("/admin/cards");
  revalidatePath("/admin/products");
}

// ---- Orders (manual ops) ----

// Manually mark a pending order paid and set its delivered content, e.g. when a
// payment landed but the callback failed. Does not touch the cards table.
export async function markOrderPaid(fd: FormData) {
  await assertAdmin();
  const outTradeNo = str(fd.get("outTradeNo"));
  const delivered = str(fd.get("deliveredContent"));
  if (!outTradeNo) throw new Error("缺少订单号");
  await query(
    `UPDATE orders SET status='paid', delivered_content=$2, paid_at=COALESCE(paid_at, now())
     WHERE out_trade_no=$1`,
    [outTradeNo, delivered]
  );
  revalidatePath("/admin/orders");
}

// Hard-delete an order. Used to clear test orders, duplicates, or records that
// should not exist. Deleting a paid order is destructive: any cards that were
// sold to it are now orphaned (their order_id still points at the deleted row
// until next time CASCADE rules propagate) — so the UI confirms before calling.
export async function deleteOrder(outTradeNo: string) {
  await assertAdmin();
  if (!outTradeNo) throw new Error("缺少订单号");
  // Unlink any sold cards so the FK is cleared even without ON DELETE CASCADE.
  await query(
    `UPDATE cards SET order_id=NULL WHERE order_id=(SELECT id FROM orders WHERE out_trade_no=$1)`,
    [outTradeNo]
  );
  await query("DELETE FROM orders WHERE out_trade_no=$1", [outTradeNo]);
  revalidatePath("/admin/orders");
}

// ---- Nav ----

// Keys that can never be hidden: /home is the site landing, / is the launcher
// (where the game lives). Hiding them either strands the visitor or makes
// the launcher itself invisible. The admin UI also enforces this by not
// rendering a toggle for these rows, but the server action re-checks so a
// crafted request can't bypass the lock.
const LOCKED_NAV_KEYS = new Set(["home", "game"]);

export async function setNavItemVisibility(fd: FormData) {
  await assertAdmin();
  const key = str(fd.get("key"));
  if (!key) throw new Error("缺少 key");
  if (LOCKED_NAV_KEYS.has(key)) {
    throw new Error(`${key} 是固定入口,不可隐藏`);
  }
  const visible = str(fd.get("visible")) === "true";
  const result = await query(
    "UPDATE nav_items SET visible=$2 WHERE key=$1",
    [key, visible]
  );
  // pg returns rowCount on result — if 0, the key didn't exist.
  if (!result.length && (result as unknown as { rowCount?: number }).rowCount === 0) {
    throw new Error(`找不到导航条目：${key}`);
  }
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/blog");
  revalidatePath("/projects");
  revalidatePath("/shop");
  revalidatePath("/admin/nav");
}

// ---- Series (blog post collections) ----

export async function saveSeries(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  const title = str(fd.get("title"));
  const description = str(fd.get("description"));
  const sort = int(fd.get("sort"));
  const showNumber = str(fd.get("showNumber")) === "true";
  if (!id || !title) throw new Error("id、标题必填");
  await query(
    `INSERT INTO series (id,title,description,show_number,sort)
       VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET
       title=EXCLUDED.title, description=EXCLUDED.description,
       show_number=EXCLUDED.show_number, sort=EXCLUDED.sort`,
    [id, title, description, showNumber, sort]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

export async function deleteSeries(id: string) {
  await assertAdmin();
  // series_posts ON DELETE CASCADE clears memberships automatically.
  await query("DELETE FROM series WHERE id=$1", [id]);
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

export async function setSeriesShowNumber(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  if (!id) throw new Error("缺少 id");
  const showNumber = str(fd.get("showNumber")) === "true";
  await query("UPDATE series SET show_number=$2 WHERE id=$1", [id, showNumber]);
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

// Append a post to a series at the end (max position + 1). ON CONFLICT DO
// NOTHING makes re-adding an already-member a safe no-op.
export async function addPostToSeries(fd: FormData) {
  await assertAdmin();
  const seriesId = str(fd.get("seriesId"));
  const postId = str(fd.get("postId"));
  if (!seriesId || !postId) throw new Error("缺少 seriesId/postId");
  await query(
    `INSERT INTO series_posts (series_id, post_id, position)
       VALUES ($1, $2,
         COALESCE((SELECT MAX(position) FROM series_posts WHERE series_id=$1), -1) + 1)
     ON CONFLICT (series_id, post_id) DO NOTHING`,
    [seriesId, postId]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

export async function removePostFromSeries(fd: FormData) {
  await assertAdmin();
  const seriesId = str(fd.get("seriesId"));
  const postId = str(fd.get("postId"));
  if (!seriesId || !postId) throw new Error("缺少 seriesId/postId");
  await query(
    "DELETE FROM series_posts WHERE series_id=$1 AND post_id=$2",
    [seriesId, postId]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

// Reorder posts within a series to match the given id sequence. Positions are
// rewritten 0..n-1 from the array order, in a single UPDATE via
// unnest + WITH ORDINALITY.
export async function reorderSeriesPosts(seriesId: string, orderedIds: string[]) {
  await assertAdmin();
  if (!seriesId || !Array.isArray(orderedIds) || orderedIds.length === 0) return;
  await query(
    `UPDATE series_posts sp SET position = sub.new_pos - 1
       FROM (
         SELECT post_id, new_pos
           FROM unnest($2::text[]) WITH ORDINALITY AS t(post_id, new_pos)
       ) sub
      WHERE sp.series_id = $1 AND sp.post_id = sub.post_id`,
    [seriesId, orderedIds]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

// ---- Banners (sidebar promo carousel) ----

export async function saveBanner(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  const title = str(fd.get("title"));
  const imageUrl = str(fd.get("imageUrl"));
  const linkUrl = str(fd.get("linkUrl"));
  const sort = int(fd.get("sort"));
  const visible = str(fd.get("visible")) === "true";
  if (!id || !imageUrl) throw new Error("id、图片必填");
  await query(
    `INSERT INTO banners (id,title,image_url,link_url,sort,visible)
       VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       title=EXCLUDED.title, image_url=EXCLUDED.image_url,
       link_url=EXCLUDED.link_url, sort=EXCLUDED.sort, visible=EXCLUDED.visible`,
    [id, title, imageUrl, linkUrl, sort, visible]
  );
  revalidatePath("/blog");
  revalidatePath("/admin/banners");
}

export async function deleteBanner(id: string) {
  await assertAdmin();
  await query("DELETE FROM banners WHERE id=$1", [id]);
  revalidatePath("/blog");
  revalidatePath("/admin/banners");
}

export async function setBannerVisibility(fd: FormData) {
  await assertAdmin();
  const id = str(fd.get("id"));
  if (!id) throw new Error("缺少 id");
  const visible = str(fd.get("visible")) === "true";
  await query("UPDATE banners SET visible=$2 WHERE id=$1", [id, visible]);
  revalidatePath("/blog");
  revalidatePath("/admin/banners");
}
