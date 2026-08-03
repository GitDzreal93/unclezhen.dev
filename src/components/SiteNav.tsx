"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/data";
import type { Locale } from "@/lib/i18n/dict";
import type { Theme } from "@/lib/theme/cookie";
import { navLabel, t } from "@/lib/i18n/dict";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

// Top nav: brand + flat list of menu items + locale/theme switchers. The
// drawer mirrors the list (no switchers in the drawer to keep it simple).
export default function SiteNav({
  items,
  active,
  locale,
  theme,
}: {
  items: NavItem[];
  active?: string;
  locale: Locale;
  theme: Theme;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav className="site-nav" aria-label={t(locale, "nav.toggle")}>
        <div className="site-nav__inner">
          <Link className="brand" href="/home">
            <span className="brand__mark">&gt;</span>
            <span>{t(locale, "brand.name")}</span>
          </Link>
          <ul className="nav-links">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                >
                  {navLabel(locale, item.key, item.label)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-controls">
            <LocaleSwitcher locale={locale} />
            <ThemeSwitcher theme={theme} />
          </div>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-label={t(locale, "nav.toggle")}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </nav>
      <div className={`nav-drawer${open ? " is-open" : ""}`}>
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {navLabel(locale, item.key, item.label)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-drawer__controls">
          <LocaleSwitcher locale={locale} />
          <ThemeSwitcher theme={theme} />
        </div>
      </div>
    </>
  );
}
