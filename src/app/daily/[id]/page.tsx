import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import DailyPaper from "@/components/DailyPaper";
import DailyMotion from "@/components/DailyMotion";
import { getIssue, getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import "../daily.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) return { title: "赛博日报" };
  const desc = `第 ${issue.issueNo} 期（${issue.publishedAt}）：头版要闻、GitHub/HuggingFace 热榜、每日开源精选、副业线报与 IT 人物志。AI 主编 + 臻叔把关的每日技术情报。`;
  return {
    title: `${issue.title} · 赛博日报`,
    description: desc,
    alternates: { canonical: `/daily/${issue.id}` },
    openGraph: {
      type: "article",
      title: issue.title,
      description: desc,
      url: `/daily/${issue.id}`,
      publishedTime: issue.publishedAt,
    },
  };
}

// 单期日报：getIssue 已按 visible=true 过滤——草稿在这里 404，发布后才可见。
export default async function DailyIssuePage({ params }: Params) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) notFound();
  const [items, locale, theme] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);

  // JSON-LD：让 Google 在搜索结果里把日报识别为带日期的 Article。
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    datePublished: issue.publishedAt,
    description: `赛博日报第 ${issue.issueNo} 期 · ${issue.publishedAt}`,
    author: { "@type": "Person", name: "臻叔", url: "https://unclezhen.cn" },
    publisher: { "@type": "Organization", name: "赛博日报", url: "https://unclezhen.cn/daily" },
    mainEntityOfPage: `https://unclezhen.cn/daily/${issue.id}`,
  };

  return (
    <>
      <SiteNav items={items} active="daily" locale={locale} theme={theme} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main">
        <div className="dp-wrap">
          {/* 水墨开卷：纸张展开 + 印章落款 + 板块洇开 */}
          <DailyMotion>
            <DailyPaper issue={issue} />
          </DailyMotion>
        </div>
        <div className="wrap" style={{ paddingBottom: 48, textAlign: "center" }}>
          <Link href="/daily" className="btn btn--ghost btn--sm">← 返回期刊列表</Link>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
