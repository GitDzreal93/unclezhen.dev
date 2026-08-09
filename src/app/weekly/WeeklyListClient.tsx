"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Issue } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

// Public list of all published issues (drafts filtered out at the SQL layer).
// Mirrors BlogListClient: search box + grid of issue cards. No sidebar for v1.
export default function WeeklyListClient({
  issues,
  locale,
}: {
  issues: Issue[];
  locale: Locale;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return issues;
    return issues.filter((it) =>
      (it.title + " " + it.weather + " " + String(it.issueNo)).toLowerCase().includes(qq)
    );
  }, [issues, q]);

  return (
    <div className="weekly-page">
      <header className="page-hero wrap">
        <div className="eyebrow">{t(locale, "weekly.eyebrow")}</div>
        <h1>{t(locale, "weekly.heading")}</h1>
        <p className="lead">{t(locale, "weekly.lead")}</p>
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder={t(locale, "weekly.searchPlaceholder")}
            aria-label={t(locale, "weekly.searchAria")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <div className="wrap weekly-list-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">{t(locale, "weekly.empty")}</div>
        ) : (
          <div className="weekly-list">
            {filtered.map((it) => (
              <Link key={it.id} className="weekly-card" href={`/weekly/${it.id}`}>
                <div className="weekly-card__meta">
                  <span className="mono">{it.publishedAt}</span>
                  <span className="tag tag--accent">
                    {t(locale, "weekly.issue", { no: it.issueNo })}
                  </span>
                </div>
                <h3>{it.title}</h3>
                {it.weather && <p className="weekly-card__weather">{it.weather}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
