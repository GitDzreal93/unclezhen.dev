import { headers } from "next/headers";
import AdminSidebar from "./AdminSidebar";
import { getLocale } from "@/lib/i18n/cookie";

// Server component. Reads the locale from the cookie and passes it to the
// client sidebar + logout button. To decide whether to render the chrome
// we read the current request pathname from the `x-pathname` header, which
// the root middleware sets on every /admin/* request. We deliberately do
// NOT use the Referer header for this — after the post-login redirect
// from /admin/login to /admin the browser sends a Referer pointing at
// /admin/login, which used to make this check mistakenly hide the chrome.
export default async function AdminChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <div className="admin-shell">
      <AdminSidebar locale={locale} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
