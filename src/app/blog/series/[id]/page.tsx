import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getSeriesWithPosts, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import SeriesClient from "./SeriesClient";
import "../../blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await getSeriesWithPosts(id);
  if (!s) return {};
  const locale = await getLocale();
  return {
    title: `${s.title} · ${t(locale, "blog.meta.title")}`,
    description: s.description,
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isNavItemVisible("blog"))) notFound();
  const { id } = await params;
  const [series, items, locale, theme] = await Promise.all([
    getSeriesWithPosts(id),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  if (!series) notFound();
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <SeriesClient series={series} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
