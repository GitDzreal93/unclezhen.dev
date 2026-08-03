import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import OrderLookup from "./OrderLookup";
import "./orders.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: t(locale, "orders.meta.title") };
}

export default async function OrdersLookupPage() {
  const [items, locale, theme] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} locale={locale} theme={theme} />
      <main id="main">
        <div className="wrap order-page">
          <div className="eyebrow">{t(locale, "orders.eyebrow")}</div>
          <h1>{t(locale, "orders.heading")}</h1>
          <p className="lead">{t(locale, "orders.lead")}</p>
          <OrderLookup locale={locale} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
