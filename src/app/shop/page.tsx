import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getProducts, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import ShopClient from "./ShopClient";
import "./shop.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: t(locale, "shop.meta.title"),
    description: t(locale, "shop.meta.desc"),
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage() {
  if (!(await isNavItemVisible("shop"))) notFound();
  const [products, items, locale, theme] = await Promise.all([
    getProducts(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="shop" locale={locale} theme={theme} />
      <main id="main">
        <ShopClient products={products} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
