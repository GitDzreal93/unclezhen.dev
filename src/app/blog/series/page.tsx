import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { getSeriesWithCounts, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import "../blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${t(locale, "blog.seriesIndex.heading")} · ${t(locale, "blog.meta.title")}`,
    description: t(locale, "blog.seriesIndex.lead"),
  };
}

// Series index — every series as a card with its post count and latest entry.
// Sort mirrors the sidebar cloud (sort ASC, created ASC), so "featured"
// series on the home page are the first cards here too.
export default async function SeriesIndexPage() {
  if (!(await isNavItemVisible("blog"))) notFound();
  const [series, items, locale, theme] = await Promise.all([
    getSeriesWithCounts(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <div className="blog-page">
          <header className="page-hero wrap">
            <div className="eyebrow">{t(locale, "blog.seriesIndex.eyebrow")}</div>
            <h1>{t(locale, "blog.seriesIndex.heading")}</h1>
            <p className="lead">{t(locale, "blog.seriesIndex.lead")}</p>
          </header>
          <div className="wrap blog-layout">
            <div className="blog-layout__primary">
              {series.length === 0 ? (
                <div className="empty-state">{t(locale, "blog.seriesIndex.empty")}</div>
              ) : (
                <Reveal as="div" className="series-grid" mode="children" y={24} stagger={0.07}>
                  {series.map((s, i) => (
                    <Link key={s.id} className="series-card" href={`/blog/series/${s.id}`}>
                      <div className="series-card__no mono">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <h3>{s.title}</h3>
                      {s.description && <p>{s.description}</p>}
                      <div className="series-card__foot">
                        <span className="series-card__count mono">
                          {s.postCount} {t(locale, "blog.seriesIndex.posts")}
                        </span>
                        <span className="series-card__cta">
                          {t(locale, "blog.seriesIndex.open")} →
                        </span>
                      </div>
                    </Link>
                  ))}
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
