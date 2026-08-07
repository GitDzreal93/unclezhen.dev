import { NextRequest } from "next/server";
import { ApiAuthError, requireApiScope, writeApiAuditLog } from "@/lib/api-tokens";
import { ContentApiError } from "@/lib/content-api";
import { apiError, apiJson, newRequestId } from "@/lib/api-response";
import { uploadImage } from "@/lib/gh-image";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// jsDelivr /gh caps a single file at 50 MB; keep the same 8 MB margin as the
// cookie-authed /api/admin/upload-image so both entry points behave alike.
const MAX_BYTES = 8 * 1024 * 1024;

const ROUTE = "/api/v1/images";

// Token-authed image upload — the API counterpart to /api/admin/upload-image.
// Multipart POST with fields: file (required, image/*), alt (optional). Returns
// the CDN url plus a ready-made Markdown tag, so a caller can upload an asset
// and then splice it straight into a post body via POST /api/v1/posts.
export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  let tokenId: string | undefined;

  try {
    const token = await requireApiScope(req, "images:write");
    tokenId = token.id;

    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      throw new ContentApiError("validation_error", "缺少文件字段 file");
    }
    if (!file.type.startsWith("image/")) {
      throw new ContentApiError("validation_error", "仅支持图片文件");
    }
    if (file.size > MAX_BYTES) {
      throw new ContentApiError(
        "validation_error",
        `图片过大（上限 ${MAX_BYTES / 1024 / 1024}MB）`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadImage({
      filename: file.name,
      contentType: file.type,
      bytes,
    });

    const alt = (fd.get("alt") as string) || "";
    await query(
      `INSERT INTO images (id,host,path,filename,bytes,content_type,alt)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        uploaded.id,
        uploaded.host,
        uploaded.path,
        uploaded.filename,
        uploaded.bytes,
        uploaded.contentType,
        alt,
      ],
    );

    await writeApiAuditLog({
      tokenId,
      method: "POST",
      route: ROUTE,
      resourceId: uploaded.id,
      statusCode: 201,
      requestId,
    });
    return apiJson(
      {
        id: uploaded.id,
        url: uploaded.url,
        filename: uploaded.filename,
        markdown: `![${alt || uploaded.filename}](${uploaded.url})`,
      },
      requestId,
      { status: 201 },
    );
  } catch (error) {
    // forbidden carries the token id on the error itself (requireApiScope knew
    // the token but it lacked the scope); surface it so the audit row links back.
    if (error instanceof ApiAuthError && error.tokenId) tokenId = error.tokenId;
    const { status, failureCode } = classify(error);
    await writeApiAuditLog({
      tokenId,
      method: "POST",
      route: ROUTE,
      statusCode: status,
      requestId,
      failureCode,
    });
    return apiErrorResponse(error, requestId);
  }
}

function classify(error: unknown): { status: number; failureCode: string } {
  if (error instanceof ApiAuthError) {
    return error.code === "unauthorized"
      ? { status: 401, failureCode: "unauthorized" }
      : { status: 403, failureCode: "forbidden" };
  }
  if (error instanceof ContentApiError) {
    return { status: 422, failureCode: "validation_error" };
  }
  return { status: 500, failureCode: "internal_error" };
}

function apiErrorResponse(error: unknown, requestId: string) {
  if (error instanceof ApiAuthError) {
    return apiError(
      error.code,
      error.code === "unauthorized"
        ? "API Token 无效或已失效"
        : "Token 没有此操作权限",
      requestId,
      error.code === "unauthorized" ? 401 : 403,
    );
  }
  if (error instanceof ContentApiError) {
    return apiError("validation_error", error.message, requestId, 422);
  }
  return apiError("internal_error", "上传失败", requestId, 500);
}
