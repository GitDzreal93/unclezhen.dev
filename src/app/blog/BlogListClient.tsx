"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Post, SeriesWithCount, Banner } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";
import BannerCarousel from "./BannerCarousel";

// Blog index: tag filter + search over all posts. Layout:
//   - full-width 横幅 banner at the top (rotating, admin-managed)
//   - left:  search + post list
//   - right: 标签 (tag filter) + 合集 (series) + footer note
export default function BlogListClient({
  posts,
  series,
  banners,
  locale,
}: {
  posts: Post[];
  series: SeriesWithCount[];
  banners: Banner[];
  locale: Locale;
}) {
  const allTag = t(locale, "blog.allTag");
  const [activeTag, setActiveTag] = useState(allTag);
  const [q, setQ] = useState("");

  const tags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((tag) => s.add(tag)));
    return [allTag, ...Array.from(s)];
  }, [posts, allTag]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const tagOk = activeTag === allTag || p.tags.includes(activeTag);
      const qq = q.trim().toLowerCase();
      const text = (p.title + " " + p.excerpt + " " + p.tags.join(" ")).toLowerCase();
      const qOk = !qq || text.includes(qq);
      return tagOk && qOk;
    });
  }, [posts, activeTag, q, allTag]);

  return (
    <div className="blog-page">
      <header className="page-hero wrap">
        <div className="eyebrow">{t(locale, "blog.eyebrow")}</div>
        <h1>{t(locale, "blog.heading")}</h1>
        <p className="lead">{t(locale, "blog.lead")}</p>
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder={t(locale, "blog.searchPlaceholder")}
            aria-label={t(locale, "blog.searchAria")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      {banners.length > 0 && (
        <div className="wrap blog-banner-strip">
          <BannerCarousel banners={banners} variant="wide" />
        </div>
      )}

      <div className="wrap blog-layout">
        <div className="blog-layout__primary">
          <div className="list-view">
            <div className="post-list">
              {filtered.map((p) => (
                <Link key={p.id} className="post" href={`/blog/${p.id}`}>
                  <div className="card__meta">
                    <span className="mono">{p.date}</span>
                    {p.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                </Link>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="empty-state">{t(locale, "blog.empty")}</div>
            )}
          </div>
        </div>

        <aside className="blog-sidebar">
          <section className="side-card">
            <h3>{t(locale, "blog.hotTags")}</h3>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag tag--btn${tag === activeTag ? " is-active" : ""}`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {series.length > 0 && (
            <section className="side-card">
              <h3>{t(locale, "blog.seriesTitle")}</h3>
              <div className="tag-cloud series-cloud">
                {series.map((s) => (
                  <Link key={s.id} className="tag tag--accent" href={`/blog/series/${s.id}`}>
                    {s.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {t(locale, "blog.footerNote")}
          </p>
        </aside>
      </div>
    </div>
  );
}
