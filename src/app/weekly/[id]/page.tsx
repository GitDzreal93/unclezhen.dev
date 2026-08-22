import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getIssue, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import WeeklyDetailClient from "./WeeklyDetailClient";
import "../weekly.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  const locale = await getLocale();
  if (!issue) return { title: t(locale, "weekly.meta.title") };
  return {
    title: `${issue.title} · ${t(locale, "weekly.meta.title")}`,
    description: `第 ${issue.issueNo} 期（${issue.publishedAt}）· 民国报纸风科技周刊：要闻、科技动态、榜单与副刊。`,
    alternates: { canonical: `/weekly/${issue.id}` },
    openGraph: {
      type: "article",
      title: issue.title,
      url: `/weekly/${issue.id}`,
      publishedTime: issue.publishedAt,
    },
  };
}

export default async function WeeklyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isNavItemVisible("blog"))) notFound();
  const { id } = await params;
  const [issue, items, locale, theme] = await Promise.all([
    getIssue(id),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  if (!issue) notFound();
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <WeeklyDetailClient issue={issue} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
