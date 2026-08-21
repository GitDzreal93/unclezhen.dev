import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ApiAuthError, requireApiScope, writeApiAuditLog } from "@/lib/api-tokens";
import { ContentApiError } from "@/lib/content-api";
import { apiError, apiJson, apiNoContent, newRequestId } from "@/lib/api-response";
import { getIssueWithSectionsForApi } from "@/lib/issues-api";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function routeFor(id: string) {
  return `/api/v1/issues/${id}`;
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof ApiAuthError) {
    return apiError(error.code, error.code === "unauthorized" ? "API Token 无效或已失效" : "Token 没有此操作权限", requestId, error.code === "unauthorized" ? 401 : 403);
  }
  if (error instanceof ContentApiError) {
    const status = error.code === "validation_error" ? 422 : error.code === "not_found" ? 404 : 409;
    return apiError(error.code, error.message, requestId, status, error.details);
  }
  return apiError("internal_error", "服务器暂时无法处理请求", requestId, 500);
}

type Ctx = { params: Promise<{ id: string }> };

// GET one issue (drafts included — the API reader is authenticated).
export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = newRequestId();
  const { id } = await ctx.params;
  try {
    await requireApiScope(req, "issues:read");
    const issue = await getIssueWithSectionsForApi(id);
    if (!issue) throw new ContentApiError("not_found", "期刊不存在");
    return apiJson(issue, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// PATCH — the publish/unpublish switch. Body: {"visible": true|false}.
// This is the human-in-the-loop step after an AI pipeline POSTs a draft.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const requestId = newRequestId();
  const { id } = await ctx.params;
  let tokenId: string | undefined;
  try {
    const token = await requireApiScope(req, "issues:write");
    tokenId = token.id;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof (body as any).visible !== "boolean") {
      throw new ContentApiError("validation_error", "请求体必须是 {\"visible\": true|false}");
    }
    const visible = (body as { visible: boolean }).visible;
    const rows = await query("UPDATE issues SET visible=$2 WHERE id=$1 RETURNING id", [id, visible]);
    if (!rows.length) throw new ContentApiError("not_found", "期刊不存在");
    revalidatePath("/daily");
    revalidatePath(`/daily/${id}`);

    await writeApiAuditLog({ tokenId, method: "PATCH", route: routeFor(id), resourceId: id, statusCode: 200, requestId });
    return apiJson({ id, visible }, requestId);
  } catch (error) {
    if (tokenId) {
      await writeApiAuditLog({
        tokenId, method: "PATCH", route: routeFor(id), resourceId: id, requestId,
        statusCode: error instanceof ContentApiError ? (error.code === "not_found" ? 404 : 422) : 500,
        failureCode: error instanceof ContentApiError ? error.code : "internal_error",
      });
    }
    return errorResponse(error, requestId);
  }
}

// DELETE — cascades to sections (FK ON DELETE CASCADE).
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const requestId = newRequestId();
  const { id } = await ctx.params;
  let tokenId: string | undefined;
  try {
    const token = await requireApiScope(req, "issues:write");
    tokenId = token.id;
    const rows = await query("DELETE FROM issues WHERE id=$1 RETURNING id", [id]);
    if (!rows.length) throw new ContentApiError("not_found", "期刊不存在");
    revalidatePath("/daily");
    revalidatePath("/admin/issues");

    await writeApiAuditLog({ tokenId, method: "DELETE", route: routeFor(id), resourceId: id, statusCode: 204, requestId });
    return apiNoContent(requestId);
  } catch (error) {
    if (tokenId) {
      await writeApiAuditLog({
        tokenId, method: "DELETE", route: routeFor(id), resourceId: id, requestId,
        statusCode: error instanceof ContentApiError && error.code === "not_found" ? 404 : 500,
        failureCode: error instanceof ContentApiError ? error.code : "internal_error",
      });
    }
    return errorResponse(error, requestId);
  }
}
