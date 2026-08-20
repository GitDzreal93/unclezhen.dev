import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import HomeScene from "@/components/HomeScene";
import HomeMotion from "@/components/HomeMotion";
import Reveal from "@/components/Reveal";
import ContactCta from "@/components/ContactCta";
import { getVisibleNavItems, getPosts, getProducts } from "@/lib/data";
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

export default async function HomePage() {
  const [items, locale, theme, posts, products] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
    getPosts(),
    getProducts(),
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
                      <a className="btn btn--ghost" href="#about">{t(locale, "home.hero.cta.about")}</a>
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

              <div className="hero-panel is-dim" id="panel-1">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>runtime · scene_01</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> ./render --ip --webgl --scroll</div>
                    <h1>{t(locale, "home.scene01.title")}</h1>
                    <p className="lead">{t(locale, "home.scene01.lead")}</p>
                    <div className="hero-actions">
                      <Link className="btn btn--ghost" href="/blog">{t(locale, "home.scene01.cta")}</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-panel is-dim" id="panel-2">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>runtime · scene_02</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> open modules/</div>
                    <h1>{t(locale, "home.scene02.title")}</h1>
                    <p className="lead">{t(locale, "home.scene02.lead")}</p>
                    <div className="hero-actions">
                      <a className="btn btn--primary" href="#modules">{t(locale, "home.scene02.cta1")}</a>
                      <Link className="btn btn--ghost" href="/shop">{t(locale, "home.scene02.cta2")}</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rest">
          <section className="section about" id="about">
            <Reveal as="div" className="wrap about__grid" mode="children" y={20} stagger={0.1}>
              <div>
                <div className="eyebrow">{t(locale, "home.about.kicker")}</div>
                <h2>{t(locale, "home.about.heading")}</h2>
              </div>
              <div className="about__text">
                <p>{t(locale, "home.about.p1")}</p>
                <p>{t(locale, "home.about.p2")}</p>
                <div className="code-block">
                  <div><span className="k">const</span> zhen = &#123;</div>
                  <div>  role: <span className="s">&quot;creative engineer&quot;</span>,</div>
                  <div>  stack: [<span className="s">&quot;TS&quot;</span>, <span className="s">&quot;React&quot;</span>, <span className="s">&quot;WebGL&quot;</span>],</div>
                  <div>  ships: [<span className="s">&quot;product&quot;</span>, <span className="s">&quot;course&quot;</span>, <span className="s">&quot;tool&quot;</span>],</div>
                  <div>&#125;;</div>
                </div>
                <ul className="skill-list" style={{ marginTop: 20 }}>
                  <li>
                    <span>frontend</span>
                    <span className="bar-track"><i style={{ width: "92%" }}></i></span>
                    <span className="lvl">{t(locale, "home.about.skills.frontend")}</span>
                  </li>
                  <li>
                    <span>motion/gl</span>
                    <span className="bar-track"><i style={{ width: "78%" }}></i></span>
                    <span className="lvl">{t(locale, "home.about.skills.motion")}</span>
                  </li>
                  <li>
                    <span>ship 0→1</span>
                    <span className="bar-track"><i style={{ width: "78%" }}></i></span>
                    <span className="lvl">{t(locale, "home.about.skills.ship")}</span>
                  </li>
                  <li>
                    <span>teach</span>
                    <span className="bar-track"><i style={{ width: "80%" }}></i></span>
                    <span className="lvl">{t(locale, "home.about.skills.teach")}</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </section>

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
