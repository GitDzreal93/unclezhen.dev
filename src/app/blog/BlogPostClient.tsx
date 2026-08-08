"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import type { Post, SeriesWithCount } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

type ImagePreview = { src: string; alt: string };

// A single post on its own URL (/blog/[id]). Carries the image lightbox
// (moved out of the old BlogClient) and a "part of series" nav at the bottom.
export default function BlogPostClient({
  post,
  series,
  locale,
}: {
  post: Post & { bodyHtml: string };
  series: SeriesWithCount[];
  locale: Locale;
}) {
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const articleBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const images = articleBodyRef.current?.querySelectorAll("img") ?? [];
    images.forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute("aria-label", image.alt ? `放大图片：${image.alt}` : "放大图片");
    });
  }, [post.id]);

  useEffect(() => {
    if (!preview) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [preview]);

  const openImagePreview = (image: HTMLImageElement) =>
    setPreview({ src: image.currentSrc || image.src, alt: image.alt });
  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLImageElement) openImagePreview(event.target);
  };
  const handleImageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLImageElement)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImagePreview(event.target);
    }
  };

  return (
    <div className="blog-page">
      <div className="wrap blog-layout blog-layout--reading">
        <div className="blog-layout__primary">
          <div className="article-view is-open">
            <Link className="btn btn--ghost btn--sm back-btn" href="/blog">
              {t(locale, "blog.back")}
            </Link>
            <article className="reading-article">
              <div className="card__meta">
                <span className="mono">{post.date}</span>
                {post.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <h1>{post.title}</h1>
              <div
                ref={articleBodyRef}
                className="body markdown-body"
                onClick={handleImageClick}
                onKeyDown={handleImageKeyDown}
                dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
              />
              {series.length > 0 && (
                <div className="post-series-nav">
                  <span className="muted">{t(locale, "blog.partOfSeries")}</span>
                  {series.map((s) => (
                    <Link key={s.id} className="tag tag--accent" href={`/blog/series/${s.id}`}>
                      {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
      {preview && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={preview.alt || "图片预览"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <button className="image-lightbox__close" type="button" autoFocus onClick={() => setPreview(null)}>
            关闭
          </button>
          <img src={preview.src} alt={preview.alt} />
        </div>
      )}
    </div>
  );
}
