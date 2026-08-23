import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import CareerFishbone from "@/components/about/CareerFishbone";
import ProjectOKR from "@/components/about/ProjectOKR";
import { AboutHero, AboutStackSection } from "@/components/about/AboutClient";
import "./about.css";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "about.meta.title"),
    description: t(locale, "about.meta.desc"),
    alternates: { canonical: "/about" },
    openGraph: { type: "profile", title: t(locale, "about.meta.title"), url: "/about" },
  };
}

export default async function AboutPage() {
  const [items, locale, theme] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="about" locale={locale} theme={theme} />
      <main id="main">
        <article className="about-page">
          {/* ===== Hero ===== */}
          <section className="about-hero">
            <div className="about-hero__text">
              <span className="about-hero__eyebrow">{t(locale, "about.hero.eyebrow")}</span>
              <h1 className="about-hero__title">臻叔</h1>
              <div
                className="about-hero__role"
                dangerouslySetInnerHTML={{ __html: t(locale, "about.hero.role") }}
              />
              <p className="about-hero__lead">{t(locale, "about.hero.lead")}</p>
              <Link className="about-hero__cta" href="#career">
                {t(locale, "about.hero.cta")} ↓
              </Link>
            </div>
            <AboutHero />
          </section>

          {/* ===== Intro (terminal block) ===== */}
          <section className="section" id="intro">
            <h2 className="section-eyebrow">
              $ about --intro
              <span className="section-eyebrow__hint">{t(locale, "about.heading")}</span>
            </h2>
            <div className="intro-terminal">
              <div className="intro-terminal__row">
                <span className="intro-terminal__prompt">$</span>
                <span><span className="intro-terminal__key">cat ./bio.md</span></span>
              </div>
              <p style={{ margin: "8px 0 14px", color: "var(--fg)" }}>{t(locale, "about.p1")}</p>
              <p style={{ margin: "0 0 14px", color: "var(--fg)" }}>{t(locale, "about.p2")}</p>
              <div className="intro-terminal__row">
                <span className="intro-terminal__prompt">$</span>
                <span>
                  <span className="intro-terminal__key">{t(locale, "about.intro.emailLabel")} = </span>
                  <a
                    className="intro-terminal__email"
                    href={`mailto:${t(locale, "about.intro.emailValue")}`}
                  >
                    {t(locale, "about.intro.emailValue")}
                  </a>
                </span>
              </div>
            </div>
          </section>

          {/* ===== Tech Stack (LogoPit) ===== */}
          <section className="section">
            <h2 className="section-eyebrow">
              {t(locale, "about.stack.title")}
              <span className="section-eyebrow__hint">{t(locale, "about.stack.lead")}</span>
            </h2>
            <AboutStackSection locale={locale} />
          </section>

          {/* ===== Career Fishbone ===== */}
          <section className="section" id="career">
            <h2 className="section-eyebrow">
              {t(locale, "about.career.title")}
              <span className="section-eyebrow__hint">{t(locale, "about.career.lead")}</span>
            </h2>
            <CareerFishbone locale={locale} />
          </section>

          {/* ===== Project OKRs ===== */}
          <section className="section" id="projects">
            <h2 className="section-eyebrow">
              {t(locale, "about.projects.title")}
              <span className="section-eyebrow__hint">{t(locale, "about.projects.lead")}</span>
            </h2>
            <ProjectOKR locale={locale} />
          </section>

          {/* ===== Contact ===== */}
          <section className="section" id="contact">
            <div className="about-contact">
              <h2 className="about-contact__title">{t(locale, "about.contact.title")}</h2>
              <p className="about-contact__lead">{t(locale, "about.contact.lead")}</p>
              <a
                className="about-contact__email"
                href={`mailto:${t(locale, "about.intro.emailValue")}?subject=${encodeURIComponent("Hi 臻叔")}`}
              >
                {t(locale, "about.intro.emailValue")} →
              </a>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
