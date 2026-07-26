import type { Metadata } from "next";
import "../globals.css";
import "./admin.css";
import AdminChrome from "./AdminChrome";

export const metadata: Metadata = {
  title: "后台 · 臻叔",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminChrome>{children}</AdminChrome>;
}
