import { revalidatePath } from "next/cache";
import { pool, query } from "./db";

export type ContentResource = "products" | "posts" | "projects";
export class ContentApiError extends Error {
  constructor(
    readonly code: "validation_error" | "not_found" | "conflict",
    message: string,
    readonly details?: Record<string, string>,
  ) { super(message); }
}

type Json = Record<string, unknown>;
const fields: Record<ContentResource, readonly string[]> = {
  posts: ["id", "title", "date", "tags", "excerpt", "body", "sort"],
  projects: ["id", "name", "type", "year", "blurb", "problem", "solution", "result", "stack", "role", "sort"],
  products: ["id", "name", "cat", "price", "descr", "stock", "sort"],
};

function object(value: unknown): Json {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new ContentApiError("validation_error", "请求体必须是 JSON 对象");
  return value as Json;
}
function string(value: unknown, field: string, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim())) throw new ContentApiError("validation_error", "请求字段无效", { [field]: "必须是非空字符串" });
  return value.trim();
}
function integer(value: unknown, field: string, min?: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || (min !== undefined && value < min)) {
    throw new ContentApiError("validation_error", "请求字段无效", { [field]: `必须是${min === undefined ? "整数" : `不小于 ${min} 的整数`}` });
  }
  return value;
}
function strings(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((x) => typeof x !== "string" || !x.trim())) {
    throw new ContentApiError("validation_error", "请求字段无效", { [field]: "必须是非空字符串数组" });
  }
  return value.map((x) => x.trim());
}
function checkKeys(input: Json, resource: ContentResource, isCreate: boolean) {
  const allowed = fields[resource];
  const invalid = Object.keys(input).filter((key) => !allowed.includes(key));
  if (invalid.length) throw new ContentApiError("validation_error", "包含不允许的字段", { [invalid[0]]: "不允许此字段" });
  if (!isCreate && Object.keys(input).length === 0) throw new ContentApiError("validation_error", "至少提供一个可更新字段");
}

export function validatePayload(resource: ContentResource, value: unknown, isCreate: boolean): Json {
  const input = object(value); checkKeys(input, resource, isCreate);
  const out: Json = {};
  if (resource === "posts") {
    out.id = string(input.id, "id", isCreate); out.title = string(input.title, "title", isCreate);
    const date = string(input.date, "date", isCreate);
    if (date) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
      const parsed = match && new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      if (!match || !parsed || parsed.getUTCFullYear() !== Number(match[1]) || parsed.getUTCMonth() !== Number(match[2]) - 1 || parsed.getUTCDate() !== Number(match[3])) {
        throw new ContentApiError("validation_error", "请求字段无效", { date: "必须是有效的 YYYY-MM-DD 日期" });
      }
    }
    out.date = date; out.tags = strings(input.tags, "tags"); out.excerpt = string(input.excerpt, "excerpt"); out.body = string(input.body, "body"); out.sort = integer(input.sort, "sort");
  } else if (resource === "projects") {
    out.id = string(input.id, "id", isCreate); out.name = string(input.name, "name", isCreate);
    for (const key of ["type", "year", "blurb", "problem", "solution", "result", "role"] as const) out[key] = string(input[key], key, key === "type" || key === "year" ? isCreate : false);
    out.stack = strings(input.stack, "stack"); out.sort = integer(input.sort, "sort");
  } else {
    out.id = string(input.id, "id", isCreate); out.name = string(input.name, "name", isCreate);
    out.cat = string(input.cat, "cat", isCreate); out.price = integer(input.price, "price", 0);
    if (isCreate && out.price === undefined) throw new ContentApiError("validation_error", "请求字段无效", { price: "必须是不小于 0 的整数" });
    out.descr = string(input.descr, "descr"); out.stock = integer(input.stock, "stock", -1); out.sort = integer(input.sort, "sort");
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

function publicProduct(row: any) { return { id: row.id, name: row.name, cat: row.cat, price: row.price, descr: row.descr, stock: row.stock }; }
function fmtPost(row: any) { return { ...row, date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date) }; }
function revalidate(resource: ContentResource) { revalidatePath(resource === "posts" ? "/blog" : resource === "projects" ? "/projects" : "/shop"); revalidatePath(`/admin/${resource}`); }

const selects: Record<ContentResource, string> = {
  posts: "id,title,date,tags,excerpt,body,sort",
  projects: "id,name,type,year,blurb,problem,solution,result,stack,role,sort",
  products: "id,name,cat,price,descr,stock,sort",
};
const order: Record<ContentResource, string> = { posts: "date DESC, sort ASC", projects: "sort ASC", products: "sort ASC" };
export async function listContent(resource: ContentResource) {
  const rows = await query<any>(`SELECT ${selects[resource]} FROM ${resource} ORDER BY ${order[resource]}`);
  return rows.map(resource === "products" ? publicProduct : resource === "posts" ? fmtPost : (x) => x);
}
export async function getContent(resource: ContentResource, id: string) {
  const rows = await query<any>(`SELECT ${selects[resource]} FROM ${resource} WHERE id=$1`, [id]);
  if (!rows[0]) throw new ContentApiError("not_found", "资源不存在");
  return resource === "products" ? publicProduct(rows[0]) : resource === "posts" ? fmtPost(rows[0]) : rows[0];
}
export async function createContent(resource: ContentResource, value: unknown) {
  const data = validatePayload(resource, value, true); const cols = Object.keys(data); const params = Object.values(data);
  try { await query(`INSERT INTO ${resource} (${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})`, params); }
  catch (err: any) { if (err?.code === "23505") throw new ContentApiError("conflict", "ID 已存在"); throw err; }
  revalidate(resource); return getContent(resource, String(data.id));
}
export async function updateContent(resource: ContentResource, id: string, value: unknown) {
  const data = validatePayload(resource, value, false); const cols = Object.keys(data);
  const result = await query<any>(`UPDATE ${resource} SET ${cols.map((key, i) => `${key}=$${i + 1}`).join(",")} WHERE id=$${cols.length + 1} RETURNING id`, [...Object.values(data), id]);
  if (!result[0]) throw new ContentApiError("not_found", "资源不存在"); revalidate(resource); return getContent(resource, id);
}
export async function deleteContent(resource: ContentResource, id: string) {
  if (resource === "products") {
    const client = await pool.connect();
    try { await client.query("BEGIN"); const result = await client.query("DELETE FROM products WHERE id=$1 RETURNING id", [id]); if (!result.rows[0]) throw new ContentApiError("not_found", "资源不存在"); await client.query("DELETE FROM cards WHERE product_id=$1 AND status='unused'", [id]); await client.query("COMMIT"); }
    catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } else { const rows = await query(`DELETE FROM ${resource} WHERE id=$1 RETURNING id`, [id]); if (!rows[0]) throw new ContentApiError("not_found", "资源不存在"); }
  revalidate(resource);
}
