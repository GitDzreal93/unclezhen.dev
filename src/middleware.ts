import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";

// Guard the admin area. The login page and the login/logout API routes stay
// public so an unauthenticated admin can get in. Everything else under /admin
// requires a valid signed session cookie; failures redirect to the login page.
//
// Also forwards the request pathname as `x-pathname` so server components
// (e.g. AdminChrome) can read the *current* URL — `next/headers` does not
// expose a direct path getter in Next 15, and falling back to the Referer
// header is wrong (it points to the previous page, e.g. /admin/login after
// the post-login redirect, which used to hide the chrome on /admin).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyToken(token);

  // Forward the current pathname to downstream server components. Must
  // rewrite the REQUEST headers (not the response) for next/headers to see.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const next = NextResponse.next({ request: { headers: requestHeaders } });

  if (isLoginPage) {
    // Already signed in? Skip the login page.
    if (ok) return NextResponse.redirect(new URL("/admin", req.url));
    return next;
  }

  if (!ok) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return next;
}

export const config = {
  matcher: ["/admin/:path*"],
};
