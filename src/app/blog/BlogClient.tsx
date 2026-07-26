"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/data";

// The blog page renders Markdown → HTML server-side and attaches bodyHtml.
type BlogPost = Post & { bodyHtml?: string };

export default function BlogClient({ posts }: { posts: BlogPost[] }) {
  const [activeTag, setActiveTag] = useState("全部");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const tags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return ["全部", ...Array.from(s)];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const tagOk = activeTag === "全部" || p.tags.includes(activeTag);
      const qq = q.trim().toLowerCase();
      const text = (p.title + " " + p.excerpt + " " + p.tags.join(" ")).toLowerCase();
      const qOk = !qq || text.includes(qq);
      return tagOk && qOk;
    });
  }, [posts, activeTag, q]);

  const openPost = openId ? posts.find((p) => p.id === openId) : null;

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">Blog</div>
        <h1>技术博客</h1>
        <p className="lead">工程实践、动效拆解与产品笔记。点击文章可展开阅读原型。</p>
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="搜索标题或标签…"
            aria-label="搜索博客"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="filters">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-btn${t === activeTag ? " is-active" : ""}`}
                onClick={() => setActiveTag(t)}
              >
                {t}
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
                      {p.tags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="empty-state">没有匹配的文章，试试其他关键词。</div>
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
                ← 返回列表
              </button>
              <article>
                <div className="card__meta">
                  <span className="mono">{openPost.date}</span>
                  {openPost.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <h1>{openPost.title}</h1>
                <div className="body" dangerouslySetInnerHTML={{ __html: openPost.bodyHtml ?? "" }} />
              </article>
            </div>
          )}
        </div>

        <aside className="side-card">
          <h3>热门标签</h3>
          <div className="tag-cloud">
            {tags
              .filter((t) => t !== "全部")
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag${t === activeTag ? " tag--accent" : ""}`}
                  onClick={() => {
                    setActiveTag(t);
                    setOpenId(null);
                  }}
                >
                  {t}
                </button>
              ))}
          </div>
          <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
            内容存于 PostgreSQL，后台以 Markdown 撰写、支持富文本粘贴导入。
          </p>
        </aside>
      </div>
    </>
  );
}
