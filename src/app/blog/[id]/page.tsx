import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getPost, getSeriesForPost, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { removeLeadingMarkdownTitle, renderMarkdown } from "@/lib/markdown";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import BlogPostClient from "../BlogPostClient";
import "../blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return {};
  const locale = await getLocale();
  return {
    title: `${post.title} · ${t(locale, "blog.meta.title")}`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isNavItemVisible("blog"))) notFound();
  const { id } = await params;
  const [post, series, items, locale, theme] = await Promise.all([
    getPost(id),
    getSeriesForPost(id),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  if (!post) notFound();
  const bodyHtml = renderMarkdown(removeLeadingMarkdownTitle(post.body, post.title));
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <BlogPostClient post={{ ...post, bodyHtml }} series={series} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
