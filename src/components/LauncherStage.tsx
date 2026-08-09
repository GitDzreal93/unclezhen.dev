"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/data";
import type { Locale } from "@/lib/i18n/dict";
import type { Theme } from "@/lib/theme/cookie";
import { navLabel, t } from "@/lib/i18n/dict";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import GameClient from "@/components/GameClient";

const HINT_KEYS: Record<string, string> = {
  home: "launcher.hint.home",
  blog: "launcher.hint.blog",
  projects: "launcher.hint.projects",
  shop: "launcher.hint.shop",
  about: "launcher.hint.about",
};

export default function LauncherStage({ items, locale, theme }: { items: NavItem[]; locale: Locale; theme: Theme }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);

  // Build the displayed list by projecting visible nav rows through the
  // code-owned hint key map. Items without a hint stay out of this launcher.
  const links = items
    .map((it, i) => {
      const hintKey = HINT_KEYS[it.key];
      const hint = hintKey ? t(locale, hintKey) : null;
      if (!hint) return null;
      return {
        key: it.key,
        href: it.href,
        name: navLabel(locale, it.key, it.label),
        hint,
        idx: String(i + 1).padStart(2, "0"),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="launch-split">
      <div className="launch-shell">
        <div className="launch-chrome">
          <div className="launch-chrome__left">
            <span className="launch-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>zhen@lab — index</span>
          </div>
          <span className="launch-status">online</span>
        </div>

        <div className="launch-body">
          <div className="launch-brand">
            <span className="brand__mark" aria-hidden="true">&gt;</span>
            <div>
              <strong className="mono" style={{ fontSize: 14, letterSpacing: "0.02em" }}>
                unclezhen
              </strong>
              <p>hacker / builder · prototype</p>
            </div>
          </div>

          <div>
            <div className="eyebrow">site map</div>
            <h1>{t(locale, "launcher.title")}</h1>
          </div>

          <p className="lead">
            {t(locale, "launcher.lead")}
          </p>

          <div className="launch-actions">
            <Link className="btn btn--primary" href="/home">{t(locale, "launcher.enterHome")}</Link>
            <Link className="btn btn--ghost" href="/projects">{t(locale, "launcher.viewProjects")}</Link>
          </div>

          <ul className="launch-links" aria-label={t(locale, "launcher.siteMap")}>
            {links.map((l) => {
              const cls = [
                activeId === l.key ? "is-active" : "",
                foundIds.includes(l.key) ? "is-found" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={l.href}>
                  <Link href={l.href} className={cls || undefined}>
                    <span className="idx">{l.idx}</span>
                    <span className="name">{l.name}</span>
                    <span className="hint">{l.hint}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="launch-foot">
            <span>{t(locale, "launcher.routes", { count: links.length })}</span>
            <span className="hint-keys">{t(locale, "launcher.keyboard")}</span>
          </div>
        </div>
      </div>

      <aside className="launch-game" aria-label={t(locale, "launcher.gameAria")}>
        <div className="launch-chrome">
          <div className="launch-chrome__left">
            <span className="launch-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>zhen@lab — game</span>
          </div>
          <span className="launch-status">playable</span>
        </div>
        <div className="launch-game__body">
          <GameClient items={items} embedded locale={locale} onActiveChange={setActiveId} onFoundChange={setFoundIds} />
        </div>
      </aside>
      <div className="launch-controls">
        <LocaleSwitcher locale={locale} />
        <ThemeSwitcher theme={theme} />
      </div>
    </div>
  );
}
