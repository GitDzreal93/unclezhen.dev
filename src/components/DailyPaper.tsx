import type { IssueSection, Issue } from "@/lib/data";
import type {
  DailyNewsBody,
  DailyRanksBody,
  DailyOssBody,
  DailySideBody,
  DailyKnowBody,
  DailyBioBody,
  DailyAdsBody,
} from "@/lib/issues-types";

// 赛博日报 v2.0 newspaper renderer. Server component — renders one issue's
// daily_* sections in the fixed 01–07 order from the prototype. Sections that
// are missing or empty are skipped, so a partial issue still reads fine.

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

// ---- 01 头版要闻 ----

function NewsSection({ body }: { body: DailyNewsBody }) {
  if (!body?.title && !body?.wire?.length) return null;
  return (
    <section className="dp-sec">
      <SecHead no="01" title="头版要闻" tag="AI 圈 · 科技圈" />
      {(body.title || body.paragraphs?.length > 0) && (
        <div className="dp-lead">
          {body.image && (
            <figure className="dp-lead-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={body.image} alt={body.imageCaption || ""} />
              {body.imageCaption && <figcaption className="dp-cap">{body.imageCaption}</figcaption>}
            </figure>
          )}
          <div className="dp-lead-body">
            {body.kicker && <span className="dp-kicker">{body.kicker}</span>}
            {body.title && <h2 className="dp-lead-title">{body.title}</h2>}
            {body.subtitle && <p className="dp-lead-sub">{body.subtitle}</p>}
            <div className="dp-body-text">
              {(body.paragraphs || []).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      )}
      {body.wire?.length > 0 && (
        <div className="dp-news-ticker">
          <div className="dp-nt-title">简讯 · NEWS WIRE</div>
          <ul>
            {body.wire.filter((w) => w.text).map((w, i) => (
              <li key={i}>{w.tag && <b>{w.tag}</b>}　{w.text}</li>
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
  return (
    <section className="dp-sec">
      <SecHead no="02" title="今日热榜" tag="SKILLS · GITHUB · DSH · HUGGINGFACE" />
      {body.intro && <p className="dp-sec-sub">{body.intro}</p>}
      <div className="dp-rank-grid">
        {body.boards.map((board, bi) => (
          <div className="dp-rank-card" key={bi}>
            <div className="dp-rc-head">
              <span className="dp-rc-dot" style={{ background: board.color || "#7c3aed" }} />
              <b>{board.name}</b>
              <span className="dp-rc-src">{board.source}</span>
            </div>
            <ol>
              {board.items.map((it, i) => (
                <li key={i}>
                  <span className="dp-rank-no">{i + 1}</span>
                  <span>
                    {it.url ? <a href={it.url} target="_blank" rel="noopener noreferrer"><b>{it.name}</b></a> : <b>{it.name}</b>}
                  </span>
                  <span className="dp-r-val">{it.value}</span>
                  {it.desc && <span className="dp-r-desc">{it.desc}</span>}
                </li>
              ))}
            </ol>
            {board.note && <p className="dp-rc-note"><b>观察：</b>{board.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- 03 今日开源项目 ----

function OssSection({ body }: { body: DailyOssBody }) {
  if (!body?.title) return null;
  return (
    <section className="dp-sec">
      <SecHead no="03" title="今日开源项目" tag="每日一荐 · DEEP DIVE" />
      <div className="dp-oss-card">
        {body.rank && <div className="dp-oss-rank">{body.rank}</div>}
        <div className="dp-oss-body">
          {body.tagline && <div className="dp-oss-tagline">{body.tagline}</div>}
          <h3>{body.title}</h3>
          {body.meta && <div className="dp-oss-meta">{body.meta}</div>}
          <div className="dp-oss-text">
            {(body.paragraphs || []).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {body.stats?.length > 0 && (
            <div className="dp-oss-stats">
              {body.stats.map((s, i) => <span key={i}>{s.label} <b>{s.value}</b></span>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- 04 副业线报 ----

function SideSection({ body }: { body: DailySideBody }) {
  if (!body?.items?.length) return null;
  return (
    <section className="dp-sec">
      <SecHead no="04" title="副业线报" tag="每日 10 条 · AI 全自动" />
      {body.intro && <p className="dp-sec-sub">{body.intro}</p>}
      <ol className="dp-side-list">
        {body.items.filter((it) => it.title || it.desc).map((it, i) => (
          <li className="dp-side-item" key={i}>
            <span className="dp-side-no">{String(i + 1).padStart(2, "0")}</span>
            <span>{it.title && <b>{it.title}</b>}{it.title && "："}{it.desc}</span>
            {it.tag && <span className="dp-s-tag">{it.tag}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---- 05 软件常识 ----

function KnowSection({ body }: { body: DailyKnowBody }) {
  if (!body?.title) return null;
  return (
    <section className="dp-sec">
      <SecHead no="05" title="软件常识" tag="每日一问 · 60 秒读懂" />
      <div className="dp-know-card">
        <h3>{body.title}</h3>
        {body.subtitle && <div className="dp-know-sub">{body.subtitle}</div>}
        <div className="dp-know-text">
          {(body.paragraphs || []).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        {body.code && <pre className="dp-code-block">{body.code}</pre>}
        {body.summary && <p className="dp-know-text">{body.summary}</p>}
      </div>
    </section>
  );
}

// ---- 06 IT 人物志 ----

function BioSection({ body }: { body: DailyBioBody }) {
  if (!body?.title) return null;
  return (
    <section className="dp-sec">
      <SecHead no="06" title="IT 人物志" tag="连载 · 每日一位" />
      <div className="dp-bio-grid">
        {body.image && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={body.image} alt={body.imageCaption || ""} />
            {body.imageCaption && <figcaption className="dp-cap">{body.imageCaption}</figcaption>}
          </figure>
        )}
        <div>
          {body.chapter && <div className="dp-bio-chap">{body.chapter}</div>}
          <h3>{body.title}</h3>
          {body.enMeta && <div className="dp-bio-en">{body.enMeta}</div>}
          <div className="dp-bio-body">
            {(body.paragraphs || []).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {body.quote && <div className="dp-bio-quote">{body.quote}</div>}
          {body.signature && <div className="dp-signature">{body.signature}</div>}
        </div>
      </div>
    </section>
  );
}

// ---- 07 广告位（不足 10 席补默认占位，与原型 JS 逻辑一致） ----

const DEFAULT_ADS: DailyAdsBody["items"] = [
  { type: "agent", title: "Agent 培训班招租", desc: "此位可投 Agent / AI 编程训练营，触达 3W+ 开发者", contact: "ads@saibo.daily" },
  { type: "gh", title: "GitHub 项目投放", desc: "新开源项目求曝光，此处为你引第一波 star", contact: "ads@saibo.daily" },
  { type: "post", title: "文章投稿位", desc: "科技/副业/工程实录，过稿即刊，稿酬从优", contact: "ads@saibo.daily" },
  { type: "default", title: "云算力资源", desc: "GPU 租用 / 推理服务，按量付费", contact: "ads@saibo.daily" },
  { type: "default", title: "技术大会冠名", desc: "大会 / Meetup 赞助席位", contact: "ads@saibo.daily" },
  { type: "default", title: "招聘位", desc: "远程 / 全职技术岗，JD 一句话直发", contact: "ads@saibo.daily" },
  { type: "default", title: "技术电子书", desc: "好书好课新上架", contact: "ads@saibo.daily" },
  { type: "default", title: "工具自荐", desc: "独立开发者的效率工具，欢迎自荐", contact: "ads@saibo.daily" },
  { type: "default", title: "公益捐赠", desc: "开源公益项目求助", contact: "ads@saibo.daily" },
  { type: "default", title: "你的广告位", desc: "第 10 席虚位以待，价格面议", contact: "ads@saibo.daily" },
];

const AD_TYPE_LABEL: Record<string, string> = {
  agent: "Agent培训", gh: "GitHub项目", post: "文章投稿", default: "其他",
};

function AdsSection({ body }: { body: DailyAdsBody }) {
  const list = [...(body?.items || []).filter((a) => a.title), ...DEFAULT_ADS].slice(0, 10);
  if (!list.length) return null;
  return (
    <section className="dp-sec">
      <SecHead no="07" title="广告招租" tag={`本期 ${list.length} 席 · 数据驱动`} />
      <ul className="dp-ad-list">
        {list.map((a, i) => (
          <li className="dp-ad-item" key={i}>
            <span className="dp-ad-no">{i + 1}</span>
            <span className={`dp-ad-type dp-ad-type--${a.type || "default"}`}>
              {AD_TYPE_LABEL[a.type] || "其他"}
            </span>
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
