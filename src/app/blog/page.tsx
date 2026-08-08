import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getPosts, getSeriesWithCounts, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import BlogListClient from "./BlogListClient";
import "./blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "blog.meta.title"),
    description: t(locale, "blog.meta.desc"),
  };
}

export default async function BlogPage() {
  if (!(await isNavItemVisible("blog"))) notFound();
  const [posts, series, items, locale, theme] = await Promise.all([
    getPosts(),
    getSeriesWithCounts(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <BlogListClient posts={posts} series={series} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
