"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { t, type Locale } from "@/lib/i18n/dict";

type NavItem = { href: string; label: string; exact?: boolean };

const NAV_KEYS: { href: string; key: keyof typeof NAV_LABELS_ZH; exact?: boolean }[] = [
  { href: "/admin", key: "admin.dashboard", exact: true },
  { href: "/admin/products", key: "admin.products" },
  { href: "/admin/cards", key: "admin.cards" },
  { href: "/admin/orders", key: "admin.orders" },
  { href: "/admin/posts", key: "admin.posts" },
  { href: "/admin/series", key: "admin.series" },
  { href: "/admin/issues", key: "admin.weekly" },
  { href: "/admin/banners", key: "admin.banners" },
  { href: "/admin/media", key: "admin.media" },
  { href: "/admin/projects", key: "admin.projects" },
  { href: "/admin/nav", key: "admin.nav" },
  { href: "/admin/api-tokens", key: "admin.apiTokens" },
  { href: "/admin/analytics", key: "admin.analytics" },
  { href: "/admin/settings", key: "admin.settings" },
];

// Labels live in the i18n dict; this local map is the canonical
// `locale → t(key)` shortcut for the sidebar's 9 entries.
function labelFor(locale: Locale, key: keyof typeof NAV_LABELS_ZH): string {
  return t(locale, key);
}

// These exist only to give the NAV_KEYS array a strict key type — the
// actual strings come from the dict. Both languages share the same set
// of keys; if either is missing, t() falls back to zh.
const NAV_LABELS_ZH = {
  "admin.dashboard": 0,
  "admin.products": 0,
  "admin.cards": 0,
  "admin.orders": 0,
  "admin.posts": 0,
  "admin.series": 0,
  "admin.weekly": 0,
  "admin.banners": 0,
  "admin.media": 0,
  "admin.projects": 0,
  "admin.nav": 0,
  "admin.apiTokens": 0,
  "admin.analytics": 0,
  "admin.settings": 0,
} as const;

export default function AdminSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  function isActive(n: (typeof NAV_KEYS)[number]) {
    if (n.exact) return pathname === n.href;
    return pathname.startsWith(n.href);
  }

  return (
    <aside className="admin-side">
      <Link className="admin-brand" href="/admin">
        <span className="admin-brand__mark">&gt;</span> zhen_admin
      </Link>
      <nav className="admin-nav">
        {NAV_KEYS.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(n) ? "page" : undefined}
          >
            {labelFor(locale, n.key)}
          </Link>
        ))}
      </nav>
      <div className="admin-side__foot">
        <Link className="admin-side__site" href="/home">
          {t(locale, "admin.backToSite")}
        </Link>
        <LogoutButton locale={locale} />
      </div>
    </aside>
  );
}
