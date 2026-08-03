import { headers } from "next/headers";
import AdminSidebar from "./AdminSidebar";
import { getLocale } from "@/lib/i18n/cookie";

// Server component. Reads the locale from the cookie and passes it to
// the client sidebar + logout button. The /admin/login route renders
// standalone (no chrome) so the cookie check is done via the request
// URL header from `next/headers`.
export default async function AdminChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const h = await headers();
  const url = h.get("x-invoke-path") || h.get("x-pathname") || h.get("referer") || "";
  // x-invoke-path comes from the server runtime; fall back to the URL
  // header, then to a simple substring check. /admin/login is the only
  // public admin route and should not show the chrome.
  if (url.includes("/admin/login")) {
    return <>{children}</>;
  }
  return (
    <div className="admin-shell">
      <AdminSidebar locale={locale} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
