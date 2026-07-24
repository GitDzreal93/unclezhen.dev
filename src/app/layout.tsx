import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "臻叔 · hacker / builder",
  description: "臻叔个人站：首页 3D IP、博客、项目、课程与商店。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
