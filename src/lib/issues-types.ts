// Per-kind TypeScript shapes for issue_sections.body. Each kind has its own
// renderer and its own admin form; this file is the single source of truth
// for both. The `kind` discriminator on IssueSection selects which shape.

export type SectionKind =
  | "masthead"
  | "dateline"
  | "lead"
  | "briefs"
  | "wire"
  | "ads"
  | "trending"
  | "supplement"
  | "colophon"
  // 赛博日报 v2.0 (docs/技术周刊_new) — modern daily briefing sections
  | "daily_news"
  | "daily_ranks"
  | "daily_oss"
  | "daily_side"
  | "daily_know"
  | "daily_bio"
  | "daily_ads";

export const SECTION_KINDS: SectionKind[] = [
  "masthead",
  "dateline",
  "lead",
  "briefs",
  "wire",
  "ads",
  "trending",
  "supplement",
  "colophon",
  "daily_news",
  "daily_ranks",
  "daily_oss",
  "daily_side",
  "daily_know",
  "daily_bio",
  "daily_ads",
];

// v2.0 daily sections in render order (01–07 of the prototype).
export const DAILY_KINDS: SectionKind[] = [
  "daily_news",
  "daily_ranks",
  "daily_oss",
  "daily_side",
  "daily_know",
  "daily_bio",
  "daily_ads",
];

// ---- masthead ----

export type MastheadBody = {
  left: {
    issueLabel: string;
    address: string;
    weather: string;
  };
  right: {
    price: string;
    cadence: string;
    ads: string;
  };
  title: string;
  strap: string;
  dateline: {
    date: string;
    weekday: string;
    lunar: string;
  };
};

// ---- dateline ----

export type DatelineBody = {
  date: string;
  weekday: string;
  lunar: string;
};

// ---- lead ----

export type LeadBody = {
  image: string;
  imageCaption: string;
  kicker: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  toc: { label: string; text: string }[];
};

// ---- briefs ----

export type BriefsBody = {
  items: {
    title: string;
    subtitle: string;
    paragraphs: string[];
  }[];
};

// ---- wire ----

export type WireBody = {
  items: { category: string; text: string }[];
};

// ---- ads ----

export type AdsBody = {
  items: { type: string; title: string; desc: string; contact: string }[];
};

// ---- trending ----

export type TrendingBody = {
  title: string;
  sub: string;
  rows: {
    rank: number;
    name: string;
    desc: string;
    lang: { name: string; color: string };
    stars: string;
    today: string;
  }[];
  digest: {
    columns: { title: string; items: { label: string; text: string }[] }[];
  };
};

// ---- supplement ----

export type SupplementBody = {
  chapter: string;
  couplet: string;
  image: string;
  imageCaption: string;
  subject: {
    title: string;
    items: { primary?: string; meta?: string; text?: string }[];
  };
  leadIn: string;
  paragraphs: string[];
  signature: string;
  comment: { heading: string; paragraphs: string[] };
};

// ---- colophon ----

export type ColophonBody = {
  editor: string;
  contact: string;
  footer: string;
};

// ---- 赛博日报 v2.0 sections ----

// 01 头版要闻
export type DailyNewsBody = {
  image: string;
  imageCaption: string;
  kicker: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  wire: { tag: string; text: string }[];
};

// 02 今日四榜 — boards render in a 2×2 grid
export type DailyRanksBody = {
  intro: string;
  boards: {
    name: string;
    color: string; // css color for the board dot
    source: string;
    items: { name: string; value: string; desc: string; url: string }[];
    note: string;
  }[];
};

// 03 今日开源项目
export type DailyOssBody = {
  rank: string;
  tagline: string;
  title: string;
  meta: string;
  paragraphs: string[];
  stats: { label: string; value: string }[];
};

// 04 副业线报
export type DailySideBody = {
  intro: string;
  items: { title: string; desc: string; tag: string }[];
};

// 05 软件常识
export type DailyKnowBody = {
  title: string;
  subtitle: string;
  paragraphs: string[];
  code: string;
  summary: string;
};

// 06 IT 人物志
export type DailyBioBody = {
  image: string;
  imageCaption: string;
  chapter: string;
  title: string;
  enMeta: string;
  paragraphs: string[];
  quote: string;
  signature: string;
};

// 07 广告位 — fewer than 10 items get padded with defaults at render time
export type DailyAdsBody = {
  items: { type: "agent" | "gh" | "post" | "default"; title: string; desc: string; contact: string }[];
};

// ---- kind → body map (used by the form dispatcher and the renderer) ----

export type SectionBodyMap = {
  masthead: MastheadBody;
  dateline: DatelineBody;
  lead: LeadBody;
  briefs: BriefsBody;
  wire: WireBody;
  ads: AdsBody;
  trending: TrendingBody;
  supplement: SupplementBody;
  colophon: ColophonBody;
  daily_news: DailyNewsBody;
  daily_ranks: DailyRanksBody;
  daily_oss: DailyOssBody;
  daily_side: DailySideBody;
  daily_know: DailyKnowBody;
  daily_bio: DailyBioBody;
  daily_ads: DailyAdsBody;
};

// Default body for a freshly-created section — kind-appropriate empty shape.
export function defaultSectionBody(kind: SectionKind): unknown {
  switch (kind) {
    case "masthead":
      return {
        left: { issueLabel: "", address: "", weather: "" },
        right: { price: "", cadence: "", ads: "" },
        title: "赛博晚报",
        strap: "技 术 周 刊",
        dateline: { date: "", weekday: "", lunar: "" },
      } satisfies MastheadBody;
    case "dateline":
      return { date: "", weekday: "", lunar: "" } satisfies DatelineBody;
    case "lead":
      return {
        image: "",
        imageCaption: "",
        kicker: "头 条",
        title: "",
        subtitle: "",
        paragraphs: [""],
        toc: [],
      } satisfies LeadBody;
    case "briefs":
      return {
        items: [
          { title: "", subtitle: "", paragraphs: [""] },
          { title: "", subtitle: "", paragraphs: [""] },
        ],
      } satisfies BriefsBody;
    case "wire":
      return {
        items: [
          { category: "", text: "" },
          { category: "", text: "" },
          { category: "", text: "" },
          { category: "", text: "" },
          { category: "", text: "" },
          { category: "", text: "" },
        ],
      } satisfies WireBody;
    case "ads":
      return { items: [] } satisfies AdsBody;
    case "trending":
      return {
        title: "GITHUB 热 榜",
        sub: "",
        rows: [],
        digest: { columns: [] },
      } satisfies TrendingBody;
    case "supplement":
      return {
        chapter: "",
        couplet: "",
        image: "",
        imageCaption: "",
        subject: { title: "本 期 人 物", items: [] },
        leadIn: "",
        paragraphs: [""],
        signature: "—— 臻叔 识",
        comment: { heading: "臻 叔 短 评", paragraphs: [""] },
      } satisfies SupplementBody;
    case "colophon":
      return {
        editor: "臻叔",
        contact: "",
        footer: "赛博晚报社 印行",
      } satisfies ColophonBody;
    case "daily_news":
      return {
        image: "",
        imageCaption: "",
        kicker: "头 条",
        title: "",
        subtitle: "",
        paragraphs: [""],
        wire: [],
      } satisfies DailyNewsBody;
    case "daily_ranks":
      return {
        intro: "",
        boards: [
          { name: "", color: "#7c3aed", source: "", items: [], note: "" },
        ],
      } satisfies DailyRanksBody;
    case "daily_oss":
      return {
        rank: "#1",
        tagline: "TODAY'S PICK",
        title: "",
        meta: "",
        paragraphs: [""],
        stats: [],
      } satisfies DailyOssBody;
    case "daily_side":
      return { intro: "", items: [] } satisfies DailySideBody;
    case "daily_know":
      return {
        title: "",
        subtitle: "",
        paragraphs: [""],
        code: "",
        summary: "",
      } satisfies DailyKnowBody;
    case "daily_bio":
      return {
        image: "",
        imageCaption: "",
        chapter: "",
        title: "",
        enMeta: "",
        paragraphs: [""],
        quote: "",
        signature: "—— 臻叔 识",
      } satisfies DailyBioBody;
    case "daily_ads":
      return { items: [] } satisfies DailyAdsBody;
  }
}

// Human label for each kind — used in the admin section picker and in the
// section list page.
export const SECTION_KIND_LABEL: Record<SectionKind, { zh: string; en: string }> = {
  masthead: { zh: "报头", en: "Masthead" },
  dateline: { zh: "日期条", en: "Dateline" },
  lead: { zh: "头版 · 要闻", en: "Lead story" },
  briefs: { zh: "二条 / 三条", en: "Briefs" },
  wire: { zh: "科技动态", en: "Tech wire" },
  ads: { zh: "广告招租", en: "Ad slots" },
  trending: { zh: "GitHub 榜单", en: "GitHub trending" },
  supplement: { zh: "副刊 · 人物志", en: "Supplement" },
  colophon: { zh: "刊记", en: "Colophon" },
  daily_news: { zh: "头版要闻", en: "Front page" },
  daily_ranks: { zh: "今日热榜", en: "Rankings" },
  daily_oss: { zh: "今日开源项目", en: "Open source pick" },
  daily_side: { zh: "副业线报", en: "Side-hustle leads" },
  daily_know: { zh: "软件常识", en: "Software concepts" },
  daily_bio: { zh: "IT 人物志", en: "IT biography" },
  daily_ads: { zh: "广告招租", en: "Ad slots" },
};
