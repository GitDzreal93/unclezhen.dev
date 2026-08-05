import { ApiAuthError, type ApiScope, requireApiScope, writeApiAuditLog } from "./api-tokens";
import { apiError, apiJson, apiNoContent, newRequestId } from "./api-response";
import { ContentApiError, type ContentResource, createContent, deleteContent, getContent, listContent, updateContent } from "./content-api";

function routeFor(resource: ContentResource, id?: string) { return `/api/v1/${resource}${id ? `/${id}` : ""}`; }
async function readBody(request: Request) {
  try { return await request.json(); }
  catch { throw new ContentApiError("validation_error", "请求体必须是有效 JSON"); }
}
function errorResponse(error: unknown, requestId: string) {
  if (error instanceof ApiAuthError) return apiError(error.code, error.code === "unauthorized" ? "API Token 无效或已失效" : "Token 没有此操作权限", requestId, error.code === "unauthorized" ? 401 : 403);
  if (error instanceof ContentApiError) {
    const status = error.code === "validation_error" ? 422 : error.code === "not_found" ? 404 : 409;
    return apiError(error.code, error.message, requestId, status, error.details);
  }
  return apiError("internal_error", "服务器暂时无法处理请求", requestId, 500);
}
async function authorize(request: Request, scope: ApiScope, route: string, requestId: string) {
  try { return await requireApiScope(request, scope); }
  catch (error) {
    if (error instanceof ApiAuthError) await writeApiAuditLog({ method: request.method, route, statusCode: error.code === "unauthorized" ? 401 : 403, requestId, tokenId: error.tokenId, failureCode: error.code });
    throw error;
  }
}
async function auditMutation(request: Request, resource: ContentResource, id: string | undefined, requestId: string, tokenId: string, statusCode: number, failureCode?: string) {
  await writeApiAuditLog({ tokenId, method: request.method, route: routeFor(resource, id), resourceId: id, statusCode, requestId, failureCode });
}

export async function collectionGet(request: Request, resource: ContentResource) {
  const requestId = newRequestId(); const route = routeFor(resource);
  try { await authorize(request, `${resource}:read` as ApiScope, route, requestId); const data = await listContent(resource); return apiJson(data, requestId, { meta: { count: data.length } }); }
  catch (error) { return errorResponse(error, requestId); }
}
export async function collectionPost(request: Request, resource: ContentResource) {
  const requestId = newRequestId(); let tokenId: string | undefined;
  try { tokenId = (await authorize(request, `${resource}:write` as ApiScope, routeFor(resource), requestId)).id; const data = await createContent(resource, await readBody(request)); await auditMutation(request, resource, String(data.id), requestId, tokenId, 201); return apiJson(data, requestId, { status: 201 }); }
  catch (error) { if (tokenId) await auditMutation(request, resource, undefined, requestId, tokenId, error instanceof ContentApiError ? (error.code === "conflict" ? 409 : 422) : 500, error instanceof ContentApiError ? error.code : "internal_error"); return errorResponse(error, requestId); }
}
export async function itemGet(request: Request, resource: ContentResource, id: string) {
  const requestId = newRequestId();
  try { await authorize(request, `${resource}:read` as ApiScope, routeFor(resource, id), requestId); return apiJson(await getContent(resource, id), requestId); }
  catch (error) { return errorResponse(error, requestId); }
}
export async function itemPatch(request: Request, resource: ContentResource, id: string) {
  const requestId = newRequestId(); let tokenId: string | undefined;
  try { tokenId = (await authorize(request, `${resource}:write` as ApiScope, routeFor(resource, id), requestId)).id; const data = await updateContent(resource, id, await readBody(request)); await auditMutation(request, resource, id, requestId, tokenId, 200); return apiJson(data, requestId); }
  catch (error) { if (tokenId) await auditMutation(request, resource, id, requestId, tokenId, error instanceof ContentApiError ? (error.code === "not_found" ? 404 : 422) : 500, error instanceof ContentApiError ? error.code : "internal_error"); return errorResponse(error, requestId); }
}
export async function itemDelete(request: Request, resource: ContentResource, id: string) {
  const requestId = newRequestId(); let tokenId: string | undefined;
  try { tokenId = (await authorize(request, `${resource}:write` as ApiScope, routeFor(resource, id), requestId)).id; await deleteContent(resource, id); await auditMutation(request, resource, id, requestId, tokenId, 204); return apiNoContent(requestId); }
  catch (error) { if (tokenId) await auditMutation(request, resource, id, requestId, tokenId, error instanceof ContentApiError && error.code === "not_found" ? 404 : 500, error instanceof ContentApiError ? error.code : "internal_error"); return errorResponse(error, requestId); }
}
