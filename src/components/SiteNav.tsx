"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";

type CTA = { href: string; label: string };

export default function SiteNav({
  active,
  cta = { href: "/shop", label: "./shop" },
}: {
  active?: string;
  cta?: CTA;
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
      <nav className="site-nav" aria-label="主导航">
        <div className="site-nav__inner">
          <Link className="brand" href="/home">
            <span className="brand__mark">&gt;</span>
            <span>zhen_shu</span>
          </Link>
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="nav-cta" href={cta.href}>
            {cta.label}
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-label="打开菜单"
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
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="drawer-cta" href={cta.href} onClick={() => setOpen(false)}>
          {cta.label}
        </Link>
      </div>
    </>
  );
}
