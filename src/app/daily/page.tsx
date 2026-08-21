import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getVisibleIssues, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import "./daily.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "赛博日报 · unclezhen",
    description: "AI 主编、臻叔把关的每日技术情报日报：要闻 / 热榜 / 开源 / 副业 / 常识 / 人物志 / 广告位。",
  };
}

// 期刊列表：最新一期大卡片 + 往期归档。v2.0 赛博日报。
export default async function DailyPage() {
  if (!(await isNavItemVisible("daily"))) notFound();
  const [issues, items, locale, theme] = await Promise.all([
    getVisibleIssues(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  // 日报期号与民国风周刊共用 issues 表；日报 id 约定以 daily- 开头。
  const dailyIssues = issues.filter((i) => i.id.startsWith("daily-"));
  const [latest, ...rest] = dailyIssues;

  return (
    <>
      <SiteNav items={items} active="daily" locale={locale} theme={theme} />
      <main id="main">
        <header className="page-hero wrap">
          <div className="eyebrow">DAILY</div>
          <h1>赛博日报</h1>
          <p className="lead">AI 主编 · 臻叔把关 · 每个工作日 07:30 出刊。七板块：要闻 / 热榜 / 开源 / 副业 / 常识 / 人物 / 广告。</p>
        </header>

        <div className="wrap" style={{ paddingBottom: 76 }}>
          {latest ? (
            <>
              <Link href={`/daily/${latest.id}`} className="daily-latest">
                <div className="daily-latest__vol">第 {String(latest.issueNo).padStart(3, "0")} 期</div>
                <div className="daily-latest__title">{latest.title}</div>
                <div className="daily-latest__meta">
                  {latest.publishedAt}
                  {latest.weather && <span> · {latest.weather}</span>}
                </div>
                <span className="daily-latest__cta">阅读整期 →</span>
              </Link>

              {rest.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginTop: 40 }}>往期归档</div>
                  <ul className="daily-archive">
                    {rest.map((issue) => (
                      <li key={issue.id}>
                        <Link href={`/daily/${issue.id}`}>
                          <span className="daily-archive__no">No.{String(issue.issueNo).padStart(3, "0")}</span>
                          <span className="daily-archive__title">{issue.title}</span>
                          <span className="daily-archive__date">{issue.publishedAt}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">还没有已发布的期刊。后台写一期，或者等 AI 主编交稿。</div>
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
