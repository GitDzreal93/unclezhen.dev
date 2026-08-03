"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

// The blog page renders Markdown → HTML server-side and attaches bodyHtml.
type BlogPost = Post & { bodyHtml?: string };

export default function BlogClient({ posts, locale }: { posts: BlogPost[]; locale: Locale }) {
  const allTag = t(locale, "blog.allTag");
  const [activeTag, setActiveTag] = useState(allTag);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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

  const openPost = openId ? posts.find((p) => p.id === openId) : null;

  return (
    <>
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
          <div className="filters">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filter-btn${tag === activeTag ? " is-active" : ""}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="wrap blog-layout">
        <div>
          {!openPost && (
            <div className="list-view">
              <div className="post-list">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="post"
                    onClick={() => setOpenId(p.id)}
                  >
                    <div className="card__meta">
                      <span className="mono">{p.date}</span>
                      {p.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="empty-state">{t(locale, "blog.empty")}</div>
              )}
            </div>
          )}

          {openPost && (
            <div className="article-view is-open">
              <button
                className="btn btn--ghost btn--sm back-btn"
                type="button"
                onClick={() => setOpenId(null)}
              >
                {t(locale, "blog.back")}
              </button>
              <article>
                <div className="card__meta">
                  <span className="mono">{openPost.date}</span>
                  {openPost.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <h1>{openPost.title}</h1>
                <div className="body" dangerouslySetInnerHTML={{ __html: openPost.bodyHtml ?? "" }} />
              </article>
            </div>
          )}
        </div>

        <aside className="side-card">
          <h3>{t(locale, "blog.hotTags")}</h3>
          <div className="tag-cloud">
            {tags
              .filter((tag) => tag !== allTag)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag${tag === activeTag ? " tag--accent" : ""}`}
                  onClick={() => {
                    setActiveTag(tag);
                    setOpenId(null);
                  }}
                >
                  {tag}
                </button>
              ))}
          </div>
          <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
            {t(locale, "blog.footerNote")}
          </p>
        </aside>
      </div>
    </>
  );
}
