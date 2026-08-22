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
    title: t(locale, "privacy.meta.title"),
    description: t(locale, "privacy.meta.desc"),
    alternates: { canonical: "/privacy" },
  };
}

const SECTIONS = [
  { key: "privacy.scope" },
  { key: "privacy.collect" },
  { key: "privacy.cookie" },
  { key: "privacy.analytics" },
  { key: "privacy.rights" },
  { key: "privacy.changes" },
] as const;

export default async function PrivacyPage() {
  const [items, locale, theme] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} locale={locale} theme={theme} />
      <main id="main">
        <article className="legal-page">
          <div className="legal-page__eyebrow">legal</div>
          <h1 className="legal-page__title">{t(locale, "privacy.heading")}</h1>
          <div className="legal-page__updated">{t(locale, "privacy.updated")}</div>
          <div className="legal-page__body">
            {SECTIONS.map((s) => (
              <section key={s.key}>
                <h2>{t(locale, `${s.key}.heading`)}</h2>
                <p>{t(locale, `${s.key}.body`)}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
