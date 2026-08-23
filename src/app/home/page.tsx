import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import HomeScene from "@/components/HomeScene";
import HomeMotion from "@/components/HomeMotion";
import Reveal from "@/components/Reveal";
import ContactCta from "@/components/ContactCta";
import { getVisibleNavItems, getPosts, getProducts, getFeaturedSeries, type FeaturedSeries } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { navLabel, t, type Locale } from "@/lib/i18n/dict";
import type { Theme } from "@/lib/theme/cookie";
import "./home.css";

export const dynamic = "force-dynamic";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Blurb copy per module-card key. The home page itself is filtered out of
// the module grid; everything else gets a blurb via the i18n dict, with a
// graceful fallback to the empty string for unknown keys.
function moduleBlurb(locale: Locale, key: string): string {
  return t(locale, `module.${key}`);
}

// One hero panel's series card. Keeps the terminal-window chrome of the
// original hardcoded panels but swaps the copy for a live featured series.
function SeriesPanel({
  series,
  locale,
  sceneNo,
}: {
  series: FeaturedSeries | undefined;
  locale: Locale;
  sceneNo: string;
}) {
  // Fallback to the original static copy when the slot has no series.
  const fallbackTitle = t(locale, `home.scene${sceneNo}.title`);
  const fallbackLead = t(locale, `home.scene${sceneNo}.lead`);
  return (
    <div className="hero-panel is-dim" id={`panel-${sceneNo === "01" ? 1 : 2}`}>
      <div className="term-window">
        <div className="term-chrome">
          <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>runtime · scene_{sceneNo}</span>
        </div>
        <div className="term-body">
          <div className="path-line">
            <span className="g">~/lab</span> <span className="g">❯</span>{" "}
            {series ? (
              <>open series/{series.id}/</>
            ) : sceneNo === "01" ? (
              <>./render --ip --webgl --scroll</>
            ) : (
              <>open modules/</>
            )}
          </div>
          {series ? (
            <>
              <div className="eyebrow">{t(locale, "home.series.kicker")}</div>
              <h1>{series.title}</h1>
              <p className="lead">{series.description || t(locale, "home.series.heading")}</p>
              {series.previewTitles.length > 0 && (
                <p className="lead series-latest">
                  <span className="g">{t(locale, "home.series.latest")}: </span>
                  {series.previewTitles[0]}
                </p>
              )}
              <div className="hero-actions">
                <Link className="btn btn--primary" href={`/blog/series/${series.id}`}>
                  {t(locale, "home.series.cta")}
                </Link>
                <span className="series-count">
                  {series.postCount} {t(locale, "home.series.posts")}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1>{fallbackTitle}</h1>
              <p className="lead">{fallbackLead}</p>
              <div className="hero-actions">
                {sceneNo === "01" ? (
                  <Link className="btn btn--ghost" href="/blog">{t(locale, "home.scene01.cta")}</Link>
                ) : (
                  <>
                    <a className="btn btn--primary" href="#modules">{t(locale, "home.scene02.cta1")}</a>
                    <Link className="btn btn--ghost" href="/shop">{t(locale, "home.scene02.cta2")}</Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [items, locale, theme, posts, products, featured] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
    getPosts(),
    getProducts(),
    getFeaturedSeries(2),
  ]);
  const modules = items.filter((i) => i.key !== "home");
  // Live counts replace the old "—" placeholders in the hero stats.
  const liveStats = {
    posts: String(posts.length),
    shop: String(products.length),
  };

  return (
    <div className="home-page">
      <HomeScene />

      <div className="hud-bar">
        <div className="hud-chip">scroll <b id="hud-scroll">0%</b></div>
        <div className="hud-chip">fps <b id="hud-fps">—</b></div>
        <div className="hud-chip">scene <b id="hud-scene">boot</b></div>
      </div>

      <SiteNav items={items} active="home" locale={locale} theme={theme} />

      <HomeMotion>
      <main id="main">
        <div className="scroll-track" id="scroll-track">
          <div className="scroll-sticky">
            <div className="panel-stack">
              <div className="hero-panel" id="panel-0">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>zhen@lab — zsh — 80×24</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> whoami</div>
                    <h1>{t(locale, "home.hero.title")} <span className="hl">{t(locale, "home.hero.name")}</span><br />{t(locale, "home.hero.heading")}</h1>
                    <p className="lead">{t(locale, "home.hero.lead")}</p>
                    <div className="hero-actions">
                      <Link className="btn btn--primary" href="/projects">{t(locale, "home.hero.cta.projects")}</Link>
                      <Link className="btn btn--ghost" href="/about">{t(locale, "home.hero.cta.about")}</Link>
                    </div>
                    <div className="stat-row">
                      <div className="stat">
                        <div className="stat__n">{t(locale, "home.stat.yrs")}</div>
                        <div className="stat__l">{t(locale, "home.stat.yrs.label")}</div>
                      </div>
                      <Link className="stat stat--link" href="/blog">
                        <div className="stat__n" data-count-to={liveStats.posts} data-count-digits={liveStats.posts.length}>
                          {liveStats.posts}
                        </div>
                        <div className="stat__l">{t(locale, "home.stat.posts.label")}</div>
                      </Link>
                      <Link className="stat stat--link" href="/shop">
                        <div className="stat__n" data-count-to={liveStats.shop} data-count-digits={liveStats.shop.length}>
                          {liveStats.shop}
                        </div>
                        <div className="stat__l">{t(locale, "home.stat.shop.label")}</div>
                      </Link>
                    </div>
                    <div className="scroll-hint">
                      <span>{t(locale, "home.scroll.hint")}</span>
                      <span className="bar"><i id="scroll-bar"></i></span>
                    </div>
                  </div>
                </div>
              </div>

              <SeriesPanel series={featured[0]} locale={locale} sceneNo="01" />

              <SeriesPanel series={featured[1]} locale={locale} sceneNo="02" />
            </div>
          </div>
        </div>

        <div className="rest">
          <section className="section modules" id="modules">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <div className="eyebrow">{t(locale, "home.modules.kicker")}</div>
                  <h2>{t(locale, "home.modules.heading")}</h2>
                </div>
                <p className="muted" style={{ maxWidth: "28ch", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                  {t(locale, "home.modules.count", { n: modules.length })}
                </p>
              </div>
              <Reveal
                as="div"
                className="grid-2"
                style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
                mode="children"
                y={28}
                stagger={0.07}
              >
                {modules.map((m, i) => (
                  <Link key={m.key} className="card" href={m.href}>
                    <div className="module-card">
                      <div className="module-card__icon">{String(i + 1).padStart(2, "0")}</div>
                      <h3>{navLabel(locale, m.key, m.label)}</h3>
                      <p>{moduleBlurb(locale, m.key)}</p>
                      <span className="link">{t(locale, "home.modules.open")} <ArrowIcon /></span>
                    </div>
                  </Link>
                ))}
              </Reveal>
            </div>
          </section>

          <Reveal as="div" className="cta-band">
            <div>
              <div className="eyebrow">{t(locale, "home.contact.kicker")}</div>
              <h2>{t(locale, "home.contact.heading")}</h2>
              <p>{t(locale, "home.contact.lead")}</p>
            </div>
            <ContactCta locale={locale} />
          </Reveal>
        </div>
      </main>
      </HomeMotion>

      <SiteFooter locale={locale} />
    </div>
  );
}
