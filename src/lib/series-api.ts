import { revalidatePath } from "next/cache";
import { ApiAuthError, requireApiScope, writeApiAuditLog, type ApiScope } from "./api-tokens";
import { ContentApiError } from "./content-api";
import { apiError, apiJson, apiNoContent, newRequestId } from "./api-response";
import { query } from "./db";

export const DYNAMIC = "force-dynamic" as const;

// Shared auth + error helpers for the series API. Series is a two-table resource
// (series + series_posts), so it can't ride content-route like the single-table
// resources do; each series endpoint reuses these.
export async function seriesAuthorize(req: Request, scope: ApiScope, route: string, requestId: string) {
  let tokenId: string | undefined;
  try {
    const token = await requireApiScope(req, scope);
    return { ok: true as const, tokenId: token.id };
  } catch (error) {
    if (error instanceof ApiAuthError && error.tokenId) tokenId = error.tokenId;
    const code = error instanceof ApiAuthError ? error.code : "unauthorized";
    await writeApiAuditLog({ tokenId, method: req.method, route, statusCode: code === "unauthorized" ? 401 : 403, requestId, failureCode: code });
    return { ok: false as const, resp: apiError(code, code === "unauthorized" ? "API Token 无效或已失效" : "Token 没有此操作权限", requestId, code === "unauthorized" ? 401 : 403) };
  }
}

export function seriesErrorResponse(error: unknown, requestId: string) {
  if (error instanceof ContentApiError) {
    const status = error.code === "not_found" ? 404 : error.code === "conflict" ? 409 : 422;
    return apiError(error.code, error.message, requestId, status);
  }
  return apiError("internal_error", error instanceof Error ? error.message : "服务器错误", requestId, 500);
}

export function seriesRevalidate() {
  revalidatePath("/blog");
  revalidatePath("/admin/series");
}

export async function readJson(req: Request): Promise<any> {
  try { return await req.json(); }
  catch { throw new ContentApiError("validation_error", "请求体必须是有效 JSON"); }
}

export function str(v: unknown, field: string, required = false): string {
  if (v === undefined && !required) return "";
  if (typeof v !== "string" || (required && !v.trim())) throw new ContentApiError("validation_error", "请求字段无效", { [field]: "必须是非空字符串" });
  return v.trim();
}

// status code + failureCode for audit, derived from a thrown error.
export function seriesAuditStatus(error: unknown): { status: number; failureCode: string } {
  if (error instanceof ContentApiError) {
    return { status: error.code === "not_found" ? 404 : error.code === "conflict" ? 409 : 422, failureCode: error.code };
  }
  return { status: 500, failureCode: "internal_error" };
}

export { apiError, apiJson, apiNoContent, newRequestId, query, ContentApiError, writeApiAuditLog };
