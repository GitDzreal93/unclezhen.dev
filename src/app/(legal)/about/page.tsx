import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import "../legal.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "about.meta.title"),
    description: t(locale, "about.meta.desc"),
    alternates: { canonical: "/about" },
    openGraph: { type: "profile", title: t(locale, "about.meta.title"), url: "/about" },
  };
}

const SKILL_BARS: Array<{ key: string; width: number }> = [
  { key: "about.skills.frontend", width: 92 },
  { key: "about.skills.motion", width: 78 },
  { key: "about.skills.ship", width: 78 },
  { key: "about.skills.teach", width: 80 },
];

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
        <article className="legal-page">
          <div className="legal-page__eyebrow">{t(locale, "nav.about")}</div>
          <h1 className="legal-page__title">{t(locale, "about.heading")}</h1>
          <p className="legal-page__lead">{t(locale, "about.meta.desc")}</p>
          <div className="legal-page__body">
            <p>{t(locale, "about.p1")}</p>
            <p>{t(locale, "about.p2")}</p>
            <h2>{t(locale, "about.skills.title")}</h2>
          </div>
          <div className="about-skills">
            {SKILL_BARS.map((s) => (
              <div key={s.key} className="about-skill">
                <span className="about-skill__label">{t(locale, s.key)}</span>
                <span className="about-skill__bar"><i style={{ transform: `scaleX(${s.width / 100})` }} /></span>
              </div>
            ))}
          </div>
          <div className="legal-page__body">
            <h2>{t(locale, "about.contact.heading")}</h2>
          </div>
          <div className="about-contact-block">{t(locale, "about.contact.body")}</div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
