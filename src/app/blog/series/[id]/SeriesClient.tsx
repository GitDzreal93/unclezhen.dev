import Link from "next/link";
import type { SeriesWithPosts } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

// Public series page: lists the series' posts ordered by their drag position.
// When the series' showNumber flag is on, each card gets a "1. 2. 3." prefix.
// Server component — no client interactivity needed.
export default function SeriesClient({
  series,
  locale,
}: {
  series: SeriesWithPosts;
  locale: Locale;
}) {
  return (
    <div className="blog-page">
      <header className="page-hero wrap">
        <div className="eyebrow">{t(locale, "blog.seriesEyebrow")}</div>
        <h1>{series.title}</h1>
        {series.description && <p className="lead">{series.description}</p>}
      </header>
      <div className="wrap blog-layout">
        <div className="blog-layout__primary">
          {series.posts.length === 0 ? (
            <div className="empty-state">{t(locale, "blog.seriesEmpty")}</div>
          ) : (
            <div className="post-list">
              {series.posts.map((p, i) => (
                <Link key={p.postId} className="post" href={`/blog/${p.postId}`}>
                  <div className="card__meta">
                    {series.showNumber && (
                      <span className="series-number mono">{`${i + 1}.`}</span>
                    )}
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
          )}
        </div>
      </div>
    </div>
  );
}
