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
  | "colophon";

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
};
