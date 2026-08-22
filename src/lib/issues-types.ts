// Per-kind TypeScript shapes for issue_sections.body. Each kind has its own
// renderer and its own admin form; this file is the single source of truth
// for both. The `kind` discriminator on IssueSection selects which shape.
//
// v3 变更（赛博日报 v3.0）：所有 daily_* 板块的 body 形状大幅精简。
//   - 移除「样式性」字段：kicker / tagline / rank / signature / chapter / 颜色 等
//     全部写死为默认值，不再让编辑者在后台配置
//   - 正文统一为一段 markdown 字符串（支持 inline HTML），由 renderer 走
//     marked → DOMPurify 渲染。图片用 `![](url)` 语法，链接用 `[text](url)`
//   - 仅保留少量真正「结构化」字段：头版/人物志的 hero image、热榜的 boards、
//     开源的 stats、广告位 items、常识的 code block
//   - 旧 v2 shape 在 daily-render.ts 里有 normalizeDailyBody 兜底

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
  | // 赛博日报 v3.0 — content-first, markdown body
  "daily_news"
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

// v3.0 daily sections in render order (01–07 of the prototype).
export const DAILY_KINDS: SectionKind[] = [
  "daily_news",
  "daily_ranks",
  "daily_oss",
  "daily_side",
  "daily_know",
  "daily_bio",
  "daily_ads",
];

// ---- v1 kinds (masthead / dateline / lead / ...) — unchanged ----

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

export type DatelineBody = {
  date: string;
  weekday: string;
  lunar: string;
};

export type LeadBody = {
  image: string;
  imageCaption: string;
  kicker: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  toc: { label: string; text: string }[];
};

export type BriefsBody = {
  items: {
    title: string;
    subtitle: string;
    paragraphs: string[];
  }[];
};

export type WireBody = {
  items: { category: string; text: string }[];
};

export type AdsBody = {
  items: { type: string; title: string; desc: string; contact: string }[];
};

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

export type ColophonBody = {
  editor: string;
  contact: string;
  footer: string;
};

// ---- 赛博日报 v3.0 sections ----

// 01 头版要闻 — hero image + markdown body + 简讯
export type DailyNewsBody = {
  image?: string;
  body: string; // markdown / inline HTML
  wire?: { tag: string; text: string }[];
};

// 02 今日热榜 — boards 仍需结构化（榜单名/数据源/条目），可附一段 markdown 引言
export type DailyRanksBody = {
  intro?: string; // markdown 短引言
  boards: {
    name: string;
    source?: string;
    items: { name: string; value: string; desc?: string; url?: string }[];
    note?: string;
  }[];
};

// 03 今日开源项目 — markdown body + 结构化 stats
export type DailyOssBody = {
  body: string; // markdown
  stats?: { label: string; value: string }[];
};

// 04 副业线报 — 一段 markdown 已足够（用 list 语法）
export type DailySideBody = {
  body: string; // markdown，可写列表 / 加粗项目 / 链接
};

// 05 软件常识 — markdown body + 可选代码块
export type DailyKnowBody = {
  body: string; // markdown
  code?: string; // 独立代码块（与 body 内的 ``` 互斥；为兼容旧 v2 留位）
};

// 06 IT 人物志 — hero image + markdown body + 独立金句（用于排版）
export type DailyBioBody = {
  image?: string;
  body: string; // markdown
  quote?: string; // 一句话金句（编辑器可空，纯排版增强）
};

// 07 广告位 — items 仍需结构化（联系方式+标题+描述）
export type DailyAdsBody = {
  items: { title: string; desc?: string; contact?: string }[];
};

// ---- kind → body map ----

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
    // v3.0 defaults — empty body, renderer's DAILY_DEFAULTS fills the chrome.
    case "daily_news":
      return { image: "", body: "", wire: [] } satisfies DailyNewsBody;
    case "daily_ranks":
      return { intro: "", boards: [] } satisfies DailyRanksBody;
    case "daily_oss":
      return { body: "", stats: [] } satisfies DailyOssBody;
    case "daily_side":
      return { body: "" } satisfies DailySideBody;
    case "daily_know":
      return { body: "", code: "" } satisfies DailyKnowBody;
    case "daily_bio":
      return { image: "", body: "", quote: "" } satisfies DailyBioBody;
    case "daily_ads":
      return { items: [] } satisfies DailyAdsBody;
  }
}

// ---- Style tokens hardcoded for v3.0 ----
// 任何「美术/版式」类的字段都不再让编辑者配置，全部在此集中维护。

export const DAILY_DEFAULTS = {
  news: {
    kicker: "头 条",
    sectionTag: "AI 圈 · 科技圈",
  },
  ranks: {
    sectionTag: "SKILLS · GITHUB · DSH · HUGGINGFACE",
    // 4 个 board 的循环色板：紫 / 蓝 / 绿 / 橙
    boardColors: ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b"] as string[],
  },
  oss: {
    rank: "#1",
    tagline: "TODAY'S PICK",
    sectionTag: "每日一荐 · DEEP DIVE",
  },
  side: {
    sectionTag: "每日 10 条 · AI 全自动",
  },
  know: {
    sectionTag: "每日一问 · 60 秒读懂",
  },
  bio: {
    signature: "—— 臻叔 识",
    sectionTag: "连载 · 每日一位",
  },
  ads: {
    sectionTag: "数据驱动 · 按周轮换",
    defaultItems: [
      { title: "Agent 培训班招租", desc: "此位可投 Agent / AI 编程训练营，触达 3W+ 开发者", contact: "ads@saibo.daily" },
      { title: "GitHub 项目投放", desc: "新开源项目求曝光，此处为你引第一波 star", contact: "ads@saibo.daily" },
      { title: "文章投稿位", desc: "科技/副业/工程实录，过稿即刊，稿酬从优", contact: "ads@saibo.daily" },
      { title: "云算力资源", desc: "GPU 租用 / 推理服务，按量付费", contact: "ads@saibo.daily" },
      { title: "技术大会冠名", desc: "大会 / Meetup 赞助席位", contact: "ads@saibo.daily" },
      { title: "招聘位", desc: "远程 / 全职技术岗，JD 一句话直发", contact: "ads@saibo.daily" },
      { title: "技术电子书", desc: "好书好课新上架", contact: "ads@saibo.daily" },
      { title: "工具自荐", desc: "独立开发者的效率工具，欢迎自荐", contact: "ads@saibo.daily" },
      { title: "公益捐赠", desc: "开源公益项目求助", contact: "ads@saibo.daily" },
      { title: "你的广告位", desc: "第 10 席虚位以待，价格面议", contact: "ads@saibo.daily" },
    ] as DailyAdsBody["items"],
  },
} as const;

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
