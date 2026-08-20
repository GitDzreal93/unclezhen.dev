"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/data";
import type { Locale } from "@/lib/i18n/dict";
import type { Theme } from "@/lib/theme/cookie";
import { navLabel, t } from "@/lib/i18n/dict";
import { gsap, useGSAP, EASE, DUR } from "@/lib/gsap";
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
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mobile-only slide-in (<860px, matching the CSS breakpoint). On desktop
  // the drawer is display:none !important, so these tweens never run there.
  useGSAP(
    () => {
      const d = drawerRef.current;
      if (!d) return;
      const links = d.querySelectorAll("ul > li");
      const mm = gsap.matchMedia();
      mm.add("(max-width: 859px) and (prefers-reduced-motion: no-preference)", () => {
        if (open) {
          gsap.fromTo(
            d,
            { autoAlpha: 0, y: -12 },
            { autoAlpha: 1, y: 0, duration: DUR.fast + 0.1, ease: EASE }
          );
          gsap.fromTo(
            links,
            { autoAlpha: 0, x: -14 },
            { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.04, ease: EASE, delay: 0.05 }
          );
        } else {
          gsap.to(d, { autoAlpha: 0, y: -8, duration: DUR.fast, ease: "power2.in" });
          gsap.set(links, { clearProps: "all" });
        }
      });
      return () => mm.revert();
    },
    { dependencies: [open] }
  );

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
      <div ref={drawerRef} className={`nav-drawer${open ? " is-open" : ""}`}>
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
