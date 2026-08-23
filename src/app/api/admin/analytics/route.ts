// Read endpoint for the analytics dashboard. Two auth paths:
//   1. Authorization: Bearer <token> with scope `analytics:read` (for
//      external agents / scripts that already use the API token system)
//   2. Admin session cookie (for the in-app /admin/analytics page)
// When a Bearer header is present it takes priority — a malformed token
// must not accidentally succeed via cookie.
import type { NextRequest } from "next/server";
import { newRequestId, apiJson, apiError, type ApiErrorCode } from "@/lib/api-response";
import { getAnalytics, defaultRange } from "@/lib/analytics";
import { requireApiScope, ApiAuthError } from "@/lib/api-tokens";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(requestId: string, code: ApiErrorCode, message: string, status: number) {
  return apiError(code, message, requestId, status);
}

function parseDate(v: string | null, fallback: string): string {
  if (!v) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return fallback;
  return v;
}

async function authorize(req: NextRequest, requestId: string) {
  const hasBearer = (req.headers.get("authorization") ?? "").startsWith("Bearer ");
  if (hasBearer) {
    try {
      await requireApiScope(req, "analytics:read");
      return null;
    } catch (e) {
      if (e instanceof ApiAuthError) {
        const status = e.code === "unauthorized" ? 401 : 403;
        return fail(requestId, e.code, e.message, status);
      }
      throw e;
    }
  }
  if (!(await isAdmin())) {
    return fail(requestId, "unauthorized", "Admin session required", 401);
  }
  return null;
}

export async function GET(req: NextRequest) {
  const requestId = newRequestId();
  const auth = await authorize(req, requestId);
  if (auth) return auth;

  const url = new URL(req.url);
  const defaults = defaultRange(30);
  const from = parseDate(url.searchParams.get("from"), defaults.from);
  const to = parseDate(url.searchParams.get("to"), defaults.to);
  const path = url.searchParams.get("path")?.trim() || undefined;

  if (from > to) {
    return fail(requestId, "validation_error", "`from` must be <= `to`", 400);
  }

  try {
    const data = await getAnalytics({ from, to, path });
    return apiJson(data, requestId);
  } catch (e) {
    console.error("[analytics] failed", e);
    return fail(requestId, "internal_error", "Failed to load analytics", 500);
  }
}
