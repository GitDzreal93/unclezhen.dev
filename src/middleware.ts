import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";

// Guard the admin area. The login page and the login/logout API routes stay
// public so an unauthenticated admin can get in. Everything else under /admin
// requires a valid signed session cookie; failures redirect to the login page.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyToken(token);

  if (isLoginPage) {
    // Already signed in? Skip the login page.
    if (ok) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  if (!ok) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
