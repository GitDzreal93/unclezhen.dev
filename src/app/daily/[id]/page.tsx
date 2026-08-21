import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import DailyPaper from "@/components/DailyPaper";
import Reveal from "@/components/Reveal";
import { getIssue, getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import "../daily.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  return {
    title: issue ? `${issue.title} · 赛博日报` : "赛博日报",
    description: issue ? `${issue.publishedAt} 第 ${issue.issueNo} 期 · AI 主编 + 臻叔把关的每日技术情报` : undefined,
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

  return (
    <>
      <SiteNav items={items} active="daily" locale={locale} theme={theme} />
      <main id="main">
        <div className="dp-wrap">
          {/* 报纸落定动画：与 weekly 一致 */}
          <Reveal as="div" y={36} rotate={-1.2} delay={0.08} start="top 94%">
            <DailyPaper issue={issue} />
          </Reveal>
        </div>
        <div className="wrap" style={{ paddingBottom: 48, textAlign: "center" }}>
          <Link href="/daily" className="btn btn--ghost btn--sm">← 返回期刊列表</Link>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
