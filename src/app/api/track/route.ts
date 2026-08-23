// Public ingest endpoint for the client-side <PageViewTracker />.
// Returns 204 on success or any kind of expected no-op (no cookie, admin
// path) so the client never has to handle a body. The three writes
// (visitor upsert, page_view insert, UV-dedup insert) all run without
// await — failures are logged, never surfaced, and never block the page.
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { apiError, apiNoContent, newRequestId, type ApiErrorCode } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "uz_visitor";
const MAX_PATH = 512;

function fail(requestId: string, code: ApiErrorCode, message: string, status: number) {
  return apiError(code, message, requestId, status);
}

export async function POST(req: Request) {
  const requestId = newRequestId();

  let body: { path?: unknown; referer?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(requestId, "validation_error", "Invalid JSON body", 400);
  }

  const path = typeof body.path === "string" ? body.path : "";
  const referer =
    typeof body.referer === "string" && body.referer.length > 0 ? body.referer : null;

  if (!path || path.length > MAX_PATH || !path.startsWith("/")) {
    return fail(requestId, "validation_error", "Invalid path", 400);
  }
  // Second line of defense — the client also skips /admin, but a misbehaving
  // client must not pollute the table. Silent 204 keeps the contract boring.
  if (path.startsWith("/admin")) {
    return apiNoContent(requestId);
  }

  const jar = await cookies();
  const visitorId = jar.get(COOKIE)?.value;
  if (!visitorId) {
    // No cookie — the client failed to stamp one. Treat as no-op so a
    // missing cookie does not break the user's session.
    return apiNoContent(requestId);
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  // All three writes are fire-and-forget. Errors only go to docker logs;
  // the response closes immediately so SPA navigation is never blocked.
  void query(
    `INSERT INTO page_visitors (visitor_id)
     VALUES ($1)
     ON CONFLICT (visitor_id) DO UPDATE
       SET last_seen = now(), visit_count = page_visitors.visit_count + 1`,
    [visitorId],
  ).catch((e) => console.error("[track] upsert visitor failed", e));

  void query(
    `INSERT INTO page_views (visitor_id, path, referer, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [visitorId, path, referer, userAgent],
  ).catch((e) => console.error("[track] insert view failed", e));

  void query(
    `INSERT INTO page_visitor_paths (visitor_id, path, visit_date)
     VALUES ($1, $2, (now() AT TIME ZONE 'UTC')::date)
     ON CONFLICT DO NOTHING`,
    [visitorId, path],
  ).catch((e) => console.error("[track] insert uv dedup failed", e));

  return apiNoContent(requestId);
}
