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
    title: t(locale, "contact.meta.title"),
    description: t(locale, "contact.meta.desc"),
    alternates: { canonical: "/contact" },
  };
}

const CARDS = [
  { key: "contact.email" },
  { key: "contact.tech" },
  { key: "contact.response" },
] as const;

export default async function ContactPage() {
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
          <div className="legal-page__eyebrow">contact</div>
          <h1 className="legal-page__title">{t(locale, "contact.heading")}</h1>
          <p className="legal-page__lead">{t(locale, "contact.intro")}</p>
          <div className="contact-grid">
            {CARDS.map((c) => (
              <div key={c.key} className="contact-card">
                <div className="contact-card__label">{t(locale, `${c.key}.label`)}</div>
                <div className="contact-card__value">{t(locale, `${c.key}.value`)}</div>
                <div className="contact-card__note">{t(locale, `${c.key}.note`)}</div>
              </div>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
