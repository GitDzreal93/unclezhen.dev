import {
  DYNAMIC, seriesAuthorize, seriesErrorResponse, seriesRevalidate, seriesAuditStatus,
  apiNoContent, newRequestId, query, ContentApiError, writeApiAuditLog,
} from "@/lib/series-api";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; postId: string }> };

// Remove a single post from a series (the post itself is not deleted).
export async function DELETE(req: Request, { params }: Context) {
  const { id, postId } = await params;
  const requestId = newRequestId();
  const route = `/api/v1/series/${id}/posts/${postId}`;
  const auth = await seriesAuthorize(req, "series:write", route, requestId);
  if (!auth.ok) return auth.resp;
  const result = await query<any>(
    "DELETE FROM series_posts WHERE series_id=$1 AND post_id=$2 RETURNING post_id",
    [id, postId],
  );
  if (!result[0]) return seriesErrorResponse(new ContentApiError("not_found", "该文章不在此合集中"), requestId);
  await writeApiAuditLog({ tokenId: auth.tokenId, method: "DELETE", route, statusCode: 204, requestId });
  seriesRevalidate();
  return apiNoContent(requestId);
}
