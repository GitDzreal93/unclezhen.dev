import {
  DYNAMIC, seriesAuthorize, seriesErrorResponse, seriesRevalidate,
  readJson, seriesAuditStatus,
  apiJson, newRequestId, query, ContentApiError, writeApiAuditLog,
} from "@/lib/series-api";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

// Add post(s) to a series. Body: { postId: "x" } or { postIds: ["x","y"] }.
// New members append at the end (max position + 1); re-adding a member is a no-op.
export async function POST(req: Request, { params }: Context) {
  const id = (await params).id;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}/posts`;
  const auth = await seriesAuthorize(req, "series:write", route, requestId);
  if (!auth.ok) return auth.resp;
  try {
    const b = await readJson(req);
    const ids: string[] = [];
    if (typeof b.postId === "string") ids.push(b.postId.trim());
    if (Array.isArray(b.postIds)) ids.push(...b.postIds.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
    const unique = Array.from(new Set(ids));
    if (unique.length === 0) throw new ContentApiError("validation_error", "请提供 postId 或 postIds");
    const s = await query<any>("SELECT id FROM series WHERE id=$1", [id]);
    if (!s[0]) throw new ContentApiError("not_found", "合集不存在");
    let added = 0;
    for (const postId of unique) {
      const r = await query<any>(
        `INSERT INTO series_posts (series_id, post_id, position)
           VALUES ($1, $2, COALESCE((SELECT MAX(position) FROM series_posts WHERE series_id=$1), -1) + 1)
         ON CONFLICT (series_id, post_id) DO NOTHING RETURNING post_id`,
        [id, postId],
      );
      if (r[0]) added++;
    }
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "POST", route, resourceId: id, statusCode: 201, requestId });
    seriesRevalidate();
    return apiJson({ seriesId: id, added }, requestId, { status: 201 });
  } catch (error) {
    const { status, failureCode } = seriesAuditStatus(error);
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "POST", route, resourceId: id, statusCode: status, requestId, failureCode });
    return seriesErrorResponse(error, requestId);
  }
}

// Reorder posts in a series. Body: { postIds: ["a","b","c"] } — positions are
// rewritten 0..n-1 from the array order (posts not listed keep their relative order).
export async function PATCH(req: Request, { params }: Context) {
  const id = (await params).id;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}/posts`;
  const auth = await seriesAuthorize(req, "series:write", route, requestId);
  if (!auth.ok) return auth.resp;
  try {
    const b = await readJson(req);
    if (!Array.isArray(b.postIds) || b.postIds.some((x: any) => typeof x !== "string" || !x.trim())) {
      throw new ContentApiError("validation_error", "postIds 必须是字符串数组");
    }
    await query(
      `UPDATE series_posts sp SET position = sub.new_pos - 1
         FROM (SELECT post_id, new_pos FROM unnest($2::text[]) WITH ORDINALITY AS t(post_id, new_pos)) sub
        WHERE sp.series_id = $1 AND sp.post_id = sub.post_id`,
      [id, b.postIds],
    );
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "PATCH", route, resourceId: id, statusCode: 200, requestId });
    seriesRevalidate();
    return apiJson({ seriesId: id, orderedIds: b.postIds }, requestId);
  } catch (error) {
    const { status, failureCode } = seriesAuditStatus(error);
    await writeApiAuditLog({ tokenId: auth.tokenId, method: "PATCH", route, resourceId: id, statusCode: status, requestId, failureCode });
    return seriesErrorResponse(error, requestId);
  }
}
