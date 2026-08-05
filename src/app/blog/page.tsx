import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getPosts, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { removeLeadingMarkdownTitle, renderMarkdown } from "@/lib/markdown";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import BlogClient from "./BlogClient";
import "./blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: t(locale, "blog.meta.title"),
    description: t(locale, "blog.meta.desc"),
  };
}

export default async function BlogPage() {
  if (!(await isNavItemVisible("blog"))) notFound();
  const [posts, items, locale, theme] = await Promise.all([
    getPosts(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  const rendered = posts.map((p) => ({
    ...p,
    bodyHtml: renderMarkdown(removeLeadingMarkdownTitle(p.body, p.title)),
  }));
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <BlogClient posts={rendered} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
