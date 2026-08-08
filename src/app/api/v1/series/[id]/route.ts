import {
  DYNAMIC, seriesAuthorize, seriesErrorResponse, seriesRevalidate,
  readJson, str, seriesAuditStatus,
  apiJson, apiNoContent, newRequestId, query, ContentApiError, writeApiAuditLog,
} from "@/lib/series-api";
import { getSeriesWithPosts } from "@/lib/data";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  const id = (await params).id;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}`;
  const auth = await seriesAuthorize(req, "series:read", route, requestId);
  if (!auth.ok) return auth.resp;
  const data = await getSeriesWithPosts(id);
  if (!data) return seriesErrorResponse(new ContentApiError("not_found", "合集不存在"), requestId);
  return apiJson(data, requestId);
}

export async function PATCH(req: Request, { params }: Context) {
  const id = (await params).id;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}`;
  const auth = await seriesAuthorize(req, "series:write", route, requestId);
  if (!auth.ok) return auth.resp;
  try {
    const b = await readJson(req);
    const sets: string[] = [];
    const vals: any[] = [];
    const add = (col: string, v: unknown) => {
      if (v !== undefined) { vals.push(v); sets.push(`${col}=$${vals.length}`); }
    };
    const title = str(b.title, "title");
    if (title) add("title", title);
    if (typeof b.description === "string") add("description", b.description);
    if (Number.isInteger(b.sort)) add("sort", b.sort);
    if (typeof b.showNumber === "boolean") add("show_number", b.showNumber);
    if (sets.length === 0) throw new ContentApiError("validation_error", "至少提供一个可更新字段");
    vals.push(id);
    const result = await query<any>(`UPDATE series SET ${sets.join(",")} WHERE id=$${vals.length} RETURNING id`, vals);
    if (!result[0]) throw new ContentApiError("not_found", "合集不存在");
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "PATCH", route, resourceId: id, statusCode: 200, requestId });
    seriesRevalidate();
    const rows = await query<any>(
      "SELECT id,title,description,show_number AS showNumber,sort FROM series WHERE id=$1",
      [id],
    );
    return apiJson(rows[0], requestId);
  } catch (error) {
    const { status, failureCode } = seriesAuditStatus(error);
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "PATCH", route, resourceId: id, statusCode: status, requestId, failureCode });
    return seriesErrorResponse(error, requestId);
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const id = (await params).id;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}`;
  const auth = await seriesAuthorize(req, "series:write", route, requestId);
  if (!auth.ok) return auth.resp;
  const result = await query<any>("DELETE FROM series WHERE id=$1 RETURNING id", [id]);
  if (!result[0]) return seriesErrorResponse(new ContentApiError("not_found", "合集不存在"), requestId);
  await writeApiAuditLog({ tokenId: auth.tokenId, method: "DELETE", route, resourceId: id, statusCode: 204, requestId });
  seriesRevalidate();
  return apiNoContent(requestId);
}
