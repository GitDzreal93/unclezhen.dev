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
  const desc = post.excerpt || `${post.title} — 臻叔的技术博客`;
  return {
    title: `${post.title} · ${t(locale, "blog.meta.title")}`,
    description: desc,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: desc,
      url: `/blog/${post.id}`,
      publishedTime: post.date,
      tags: post.tags,
    },
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
  // JSON-LD：文章结构化数据（标题/日期/标签），提升 Google 富结果概率。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: "臻叔", url: "https://unclezhen.cn" },
    mainEntityOfPage: `https://unclezhen.cn/blog/${post.id}`,
  };
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main">
        <BlogPostClient post={{ ...post, bodyHtml }} series={series} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
