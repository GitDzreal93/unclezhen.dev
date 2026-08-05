import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, createToken } from "@/lib/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.warn("login: bad json", e);
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  try {
    const { password } = (body ?? {}) as { password?: unknown };
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    const token = await createToken();
    const res = NextResponse.json({ ok: true });
    // Set the Secure flag only when the client actually reaches us over HTTPS —
    // either behind a reverse proxy (x-forwarded-proto) or by canonical
    // SITE_URL. Over plain HTTP (current IP access) we must NOT set Secure, or
    // the browser drops the session cookie and login silently fails.
    const secure =
      (req.headers.get("x-forwarded-proto") ?? "").includes("https") ||
      (process.env.SITE_URL ?? "").startsWith("https");
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "登录失败" },
      { status: 500 }
    );
  }
}
