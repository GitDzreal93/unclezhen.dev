import { NextRequest } from "next/server";
import { ApiAuthError, requireApiScope, writeApiAuditLog } from "@/lib/api-tokens";
import { ContentApiError } from "@/lib/content-api";
import { apiError, apiJson, newRequestId } from "@/lib/api-response";
import { upsertIssueWithSections, validateIssuePayload } from "@/lib/issues-api";
import { getVisibleIssues } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/issues";

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

// GET /api/v1/issues — published issues, latest first (no sections payload).
export async function GET(req: NextRequest) {
  const requestId = newRequestId();
  try {
    await requireApiScope(req, "issues:read");
    return apiJson(await getVisibleIssues(), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// POST /api/v1/issues — whole-issue upsert. Send the complete issue JSON in
// one shot: metadata + all sections. Sections omitted from the array are
// deleted (a board left empty upstream simply isn't saved). visible defaults
// to false (draft) so an AI pipeline can stage an issue for human review
// before publishing via PATCH or the admin UI.
export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  let tokenId: string | undefined;
  const audit = (resourceId: string | undefined, statusCode: number, failureCode?: string) =>
    writeApiAuditLog({ tokenId, method: "POST", route: ROUTE, resourceId, statusCode, requestId, failureCode });
  try {
    const token = await requireApiScope(req, "issues:write");
    tokenId = token.id;

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      throw new ContentApiError("validation_error", "请求体必须是 JSON 对象");
    }
    const data = validateIssuePayload(payload);
    const saved = await upsertIssueWithSections(data);

    await audit(String(saved.id), 201);
    return apiJson(saved, requestId, { status: 201 });
  } catch (error) {
    if (tokenId) {
      await audit(
        undefined,
        error instanceof ContentApiError ? (error.code === "conflict" ? 409 : 422) : 500,
        error instanceof ContentApiError ? error.code : "internal_error",
      );
    }
    return errorResponse(error, requestId);
  }
}
