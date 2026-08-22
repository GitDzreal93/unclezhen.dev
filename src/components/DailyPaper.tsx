import type { IssueSection, Issue } from "@/lib/data";
import {
  DAILY_DEFAULTS,
  type DailyNewsBody,
  type DailyRanksBody,
  type DailyOssBody,
  type DailySideBody,
  type DailyKnowBody,
  type DailyBioBody,
  type DailyAdsBody,
} from "@/lib/issues-types";
import { renderMarkdown } from "@/lib/markdown";

// 赛博日报 v3.0 newspaper renderer. Server component. Renders one issue's
// daily_* sections in the fixed 01–07 order from the prototype. All
// 「style」 fields (kicker / tagline / rank / signature / color) are read from
// DAILY_DEFAULTS — never from the body. Body content is markdown (with inline
// HTML support) rendered via marked + DOMPurify. Sections that are missing or
// empty are skipped, so a partial issue still reads fine.

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function weekdayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? "" : "周" + WEEKDAYS[d.getDay()];
}

export default function DailyPaper({ issue }: { issue: Issue & { sections: IssueSection[] } }) {
  const byKind = new Map(issue.sections.map((s) => [s.kind, s]));
  const news = byKind.get("daily_news");
  const ranks = byKind.get("daily_ranks");
  const oss = byKind.get("daily_oss");
  const side = byKind.get("daily_side");
  const know = byKind.get("daily_know");
  const bio = byKind.get("daily_bio");
  const ads = byKind.get("daily_ads");

  const vol = String(issue.issueNo).padStart(3, "0");

  return (
    <div className="dp-page">
      <div className="dp-topbar">
        <span>VOL.{vol} · {issue.publishedAt} {weekdayOf(issue.publishedAt)}</span>
        <span>数据：GitHub / HuggingFace / skills.sh / dsh / 科技媒体</span>
        <span>主理：<b>臻叔</b></span>
      </div>

      <header className="dp-masthead">
        <div className="dp-mh-side dp-mh-side--left">
          第 <span className="dp-big">{vol}</span> 期<br />
          出版：每工作日 07:30<br />
          {issue.weather && <>天气：{issue.weather}<br /></>}
          阅读时长 ≈ 10 分钟
        </div>
        <div className="dp-mh-center">
          <h1 className="dp-mh-title">赛博<span className="dp-dot">日报</span></h1>
          <div className="dp-mh-strap">DAILY TECH INTELLIGENCE</div>
        </div>
        <div className="dp-mh-side dp-mh-side--right">
          技术情报 · 精选速览<span className="dp-seal">臻叔</span><br />
          七板块：要闻 / 热榜 / 开源 / 副业 / 常识 / 人物<br />
          广告洽：ads@saibo.daily
        </div>
      </header>

      {news && <NewsSection body={news.body as DailyNewsBody} />}
      {ranks && <RanksSection body={ranks.body as DailyRanksBody} />}
      {oss && <OssSection body={oss.body as DailyOssBody} />}
      {side && <SideSection body={side.body as DailySideBody} />}
      {know && <KnowSection body={know.body as DailyKnowBody} />}
      {bio && <BioSection body={bio.body as DailyBioBody} />}
      {ads && <AdsSection body={ads.body as DailyAdsBody} />}

      <footer className="dp-colophon">
        本报由 <span className="dp-seal">臻叔</span> 主理 · AI 主编 + 人工把关 · 数据源：GitHub / HuggingFace / skills.sh / RSSHub / 科技媒体<br />
        广告与投稿：ads@saibo.daily　|　赛博日报社 印行 · {issue.publishedAt} · 第 {vol} 期
      </footer>
    </div>
  );
}

function SecHead({ no, title, tag }: { no: string; title: string; tag: string }) {
  return (
    <div className="dp-sec-head">
      <span className="dp-sec-no">{no}</span>
      <h2>{title}</h2>
      <span className="dp-sec-tag">{tag}</span>
    </div>
  );
}

// `<Md>` — render a markdown body string as sanitized HTML inside a slot.
// dangerouslySetInnerHTML is safe because renderMarkdown runs DOMPurify first.
function Md({ source }: { source: string }) {
  const html = renderMarkdown(source || "");
  return <div className="dp-md" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---- 01 头版要闻 ----

function NewsSection({ body }: { body: DailyNewsBody }) {
  const hasBody = Boolean(body?.body?.trim());
  const hasWire = (body?.wire?.length ?? 0) > 0;
  if (!hasBody && !hasWire) return null;
  const { kicker } = DAILY_DEFAULTS.news;
  return (
    <section className="dp-sec">
      <SecHead no="01" title="头版要闻" tag={DAILY_DEFAULTS.news.sectionTag} />
      {hasBody && (
        <div className="dp-lead">
          {body.image && (
            <figure className="dp-lead-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={body.image} alt="" />
            </figure>
          )}
          <div className="dp-lead-body">
            <span className="dp-kicker">{kicker}</span>
            <Md source={body.body} />
          </div>
        </div>
      )}
      {hasWire && (
        <div className="dp-news-ticker">
          <div className="dp-nt-title">简讯 · NEWS WIRE</div>
          <ul>
            {body.wire!.filter((w) => w.text).map((w, i) => (
              <li key={i}>{w.tag && <b>{w.tag}</b>}{w.tag && "　"}{w.text}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---- 02 今日四榜 ----

function RanksSection({ body }: { body: DailyRanksBody }) {
  if (!body?.boards?.length) return null;
  const colors = DAILY_DEFAULTS.ranks.boardColors;
  return (
    <section className="dp-sec">
      <SecHead no="02" title="今日热榜" tag={DAILY_DEFAULTS.ranks.sectionTag} />
      {body.intro && <Md source={body.intro} />}
      <div className="dp-rank-grid">
        {body.boards.map((board, bi) => {
          const color = colors[bi % colors.length];
          return (
            <div className="dp-rank-card" key={bi}>
              <div className="dp-rc-head">
                <span className="dp-rc-dot" style={{ background: color }} />
                <b>{board.name}</b>
                {board.source && <span className="dp-rc-src">{board.source}</span>}
              </div>
              <ol>
                {(board.items || []).map((it, i) => (
                  <li key={i}>
                    <span className="dp-rank-no">{i + 1}</span>
                    <span>
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noopener noreferrer">
                          <b>{it.name}</b>
                        </a>
                      ) : (
                        <b>{it.name}</b>
                      )}
                    </span>
                    <span className="dp-r-val">{it.value}</span>
                    {it.desc && <span className="dp-r-desc">{it.desc}</span>}
                  </li>
                ))}
              </ol>
              {board.note && (
                <p className="dp-rc-note">
                  <b>观察：</b>
                  {board.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- 03 今日开源项目 ----

function OssSection({ body }: { body: DailyOssBody }) {
  if (!body?.body?.trim()) return null;
  const { rank, tagline } = DAILY_DEFAULTS.oss;
  return (
    <section className="dp-sec">
      <SecHead no="03" title="今日开源项目" tag={DAILY_DEFAULTS.oss.sectionTag} />
      <div className="dp-oss-card">
        <div className="dp-oss-rank">{rank}</div>
        <div className="dp-oss-body">
          <div className="dp-oss-tagline">{tagline}</div>
          <Md source={body.body} />
          {(body.stats?.length ?? 0) > 0 && (
            <div className="dp-oss-stats">
              {body.stats!.map((s, i) => (
                <span key={i}>
                  {s.label} <b>{s.value}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- 04 副业线报 ----

function SideSection({ body }: { body: DailySideBody }) {
  if (!body?.body?.trim()) return null;
  return (
    <section className="dp-sec">
      <SecHead no="04" title="副业线报" tag={DAILY_DEFAULTS.side.sectionTag} />
      <Md source={body.body} />
    </section>
  );
}

// ---- 05 软件常识 ----

function KnowSection({ body }: { body: DailyKnowBody }) {
  if (!body?.body?.trim() && !body?.code?.trim()) return null;
  return (
    <section className="dp-sec">
      <SecHead no="05" title="软件常识" tag={DAILY_DEFAULTS.know.sectionTag} />
      <div className="dp-know-card">
        {body.body && <Md source={body.body} />}
        {body.code && <pre className="dp-code-block">{body.code}</pre>}
      </div>
    </section>
  );
}

// ---- 06 IT 人物志 ----

function BioSection({ body }: { body: DailyBioBody }) {
  if (!body?.body?.trim()) return null;
  return (
    <section className="dp-sec">
      <SecHead no="06" title="IT 人物志" tag={DAILY_DEFAULTS.bio.sectionTag} />
      <div className="dp-bio-grid">
        {body.image && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={body.image} alt="" />
          </figure>
        )}
        <div>
          <Md source={body.body} />
          {body.quote && <div className="dp-bio-quote">{body.quote}</div>}
          <div className="dp-signature">{DAILY_DEFAULTS.bio.signature}</div>
        </div>
      </div>
    </section>
  );
}

// ---- 07 广告位（不足 10 席补默认占位） ----

function AdsSection({ body }: { body: DailyAdsBody }) {
  const userItems = (body?.items || []).filter((a) => a.title);
  const list = [...userItems, ...DAILY_DEFAULTS.ads.defaultItems].slice(0, 10);
  if (!list.length) return null;
  return (
    <section className="dp-sec">
      <SecHead no="07" title="广告招租" tag={`本期 ${list.length} 席 · ${DAILY_DEFAULTS.ads.sectionTag}`} />
      <ul className="dp-ad-list">
        {list.map((a, i) => (
          <li className="dp-ad-item" key={i}>
            <span className="dp-ad-no">{i + 1}</span>
            <span className="dp-ad-main">
              <span className="dp-ad-title">{a.title}</span>{" "}
              {a.desc && <span className="dp-ad-desc">{a.desc}</span>}
            </span>
            {a.contact && <span className="dp-ad-contact">{a.contact}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
