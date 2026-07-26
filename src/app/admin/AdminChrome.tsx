"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

// Wraps admin pages with the sidebar chrome, except the login page which is a
// standalone full-screen form.
export default function AdminChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}