"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/admin", label: "仪表盘", exact: true },
  { href: "/admin/products", label: "商品" },
  { href: "/admin/cards", label: "卡密池" },
  { href: "/admin/orders", label: "订单" },
  { href: "/admin/posts", label: "博客" },
  { href: "/admin/projects", label: "项目" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(n: (typeof NAV)[number]) {
    if (n.exact) return pathname === n.href;
    return pathname.startsWith(n.href);
  }

  return (
    <aside className="admin-side">
      <Link className="admin-brand" href="/admin">
        <span className="admin-brand__mark">&gt;</span> zhen_admin
      </Link>
      <nav className="admin-nav">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(n) ? "page" : undefined}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="admin-side__foot">
        <Link className="admin-side__site" href="/home">
          ← 回到站点
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}