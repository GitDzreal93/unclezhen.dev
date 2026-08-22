// 赛博日报 v3.0 渲染辅助：把数据库里的 body 形态规整为新 shape，再交给
// DailyPaper 渲染。同时把 v2 的「样式性」字段映射为 DAILY_DEFAULTS 的硬编码值。
//
// 旧 v2 body 形状（存在即可识别为旧数据）：
//   daily_news: { image, imageCaption, kicker, title, subtitle, paragraphs[], wire[] }
//   daily_ranks: { intro, boards[{ name, color, source, items, note }] }
//   daily_oss:   { rank, tagline, title, meta, paragraphs[], stats[] }
//   daily_side:  { intro, items[{ title, desc, tag }] }
//   daily_know:  { title, subtitle, paragraphs[], code, summary }
//   daily_bio:   { image, imageCaption, chapter, title, enMeta, paragraphs[], quote, signature }
//   daily_ads:   { items[{ type, title, desc, contact }] }
//
// 新 v3 body 形状（见 issues-types.ts）：
//   daily_news: { image?, body, wire? }
//   daily_ranks: { intro?, boards[{ name, source?, items[], note? }] }
//   daily_oss:   { body, stats? }
//   daily_side:  { body }
//   daily_know:  { body, code? }
//   daily_bio:   { image?, body, quote? }
//   daily_ads:   { items[{ title, desc?, contact? }] }

import type {
  DailyNewsBody,
  DailyRanksBody,
  DailyOssBody,
  DailySideBody,
  DailyKnowBody,
  DailyBioBody,
  DailyAdsBody,
  SectionKind,
} from "./issues-types";

// 旧 shape 嗅探：v2 才有这些字段名，v3 不会引入（v3 body 是字符串，不是 paragraphs 数组）
function isV2News(b: any): b is { image?: string; imageCaption?: string; kicker?: string; title?: string; subtitle?: string; paragraphs?: string[]; wire?: { tag: string; text: string }[] } {
  return b && typeof b === "object" && Array.isArray(b.paragraphs);
}
function isV2Ranks(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.boards) && b.boards.some((x: any) => "color" in (x || {}));
}
function isV2Oss(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.paragraphs) && ("rank" in b || "tagline" in b || "title" in b);
}
function isV2Side(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.items) && b.items.every((x: any) => x && ("desc" in x || "tag" in x)) && !("body" in b);
}
function isV2Know(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.paragraphs) && ("title" in b || "summary" in b);
}
function isV2Bio(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.paragraphs) && ("signature" in b || "enMeta" in b || "chapter" in b);
}
function isV2Ads(b: any): boolean {
  return b && typeof b === "object" && Array.isArray(b.items) && b.items.some((x: any) => x && "type" in x);
}

function joinParagraphs(paras: unknown): string {
  if (!Array.isArray(paras)) return "";
  return (paras as unknown[]).filter((p): p is string => typeof p === "string" && Boolean(p)).join("\n\n");
}

function pickStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

// Normalize one daily_* body. If the input is already v3, returned as-is.
// If it's v2, converted on the fly. Renderer always sees v3.
export function normalizeDailyBody<T extends SectionKind>(kind: T, raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  const b = raw as Record<string, unknown>;

  switch (kind) {
    case "daily_news": {
      if (isV2News(b)) {
        const title = pickStr(b.title);
        const subtitle = pickStr(b.subtitle);
        const parts: string[] = [];
        if (title) parts.push(`## ${title}`);
        if (subtitle) parts.push(`**${subtitle}**`);
        if (Array.isArray(b.paragraphs)) parts.push(joinParagraphs(b.paragraphs));
        const body = parts.filter(Boolean).join("\n\n");
        return {
          image: pickStr(b.image),
          body,
          wire: Array.isArray(b.wire) ? (b.wire as any[]).filter((w) => w && typeof w.text === "string" && w.text) : [],
        } satisfies DailyNewsBody;
      }
      return b as DailyNewsBody;
    }
    case "daily_ranks": {
      if (isV2Ranks(b)) {
        return {
          intro: pickStr(b.intro),
          boards: ((b.boards as any[]) || []).map((brd) => ({
            name: pickStr(brd.name) || "",
            source: pickStr(brd.source),
            items: ((brd.items as any[]) || []).map((it) => ({
              name: pickStr(it.name) || "",
              value: pickStr(it.value) || "",
              desc: pickStr(it.desc),
              url: pickStr(it.url),
            })),
            note: pickStr(brd.note),
          })),
        } satisfies DailyRanksBody;
      }
      return b as DailyRanksBody;
    }
    case "daily_oss": {
      if (isV2Oss(b)) {
        return {
          body: joinParagraphs(b.paragraphs),
          stats: Array.isArray(b.stats) ? (b.stats as any[]).filter((s) => s && typeof s.label === "string" && typeof s.value === "string") : [],
        } satisfies DailyOssBody;
      }
      return b as DailyOssBody;
    }
    case "daily_side": {
      if (isV2Side(b)) {
        const items = ((b.items as any[]) || []).filter((it) => it && (pickStr(it.title) || pickStr(it.desc)));
        const md = items
          .map((it) => {
            const t = pickStr(it.title) || "";
            const d = pickStr(it.desc) || "";
            const tag = pickStr(it.tag);
            return `- **${t}** — ${d}${tag ? ` _(${tag})_` : ""}`;
          })
          .join("\n");
        return { body: md } satisfies DailySideBody;
      }
      return b as DailySideBody;
    }
    case "daily_know": {
      if (isV2Know(b)) {
        const title = pickStr(b.title);
        const subtitle = pickStr(b.subtitle);
        const summary = pickStr(b.summary);
        const parts: string[] = [];
        if (title) parts.push(`## ${title}`);
        if (subtitle) parts.push(`*${subtitle}*`);
        if (Array.isArray(b.paragraphs)) parts.push(joinParagraphs(b.paragraphs));
        if (summary) parts.push(`> **小结**：${summary}`);
        return {
          body: parts.filter(Boolean).join("\n\n"),
          code: pickStr(b.code),
        } satisfies DailyKnowBody;
      }
      return b as DailyKnowBody;
    }
    case "daily_bio": {
      if (isV2Bio(b)) {
        const title = pickStr(b.title);
        const enMeta = pickStr(b.enMeta);
        const parts: string[] = [];
        if (title) parts.push(`## ${title}`);
        if (enMeta) parts.push(`*${enMeta}*`);
        if (Array.isArray(b.paragraphs)) parts.push(joinParagraphs(b.paragraphs));
        return {
          image: pickStr(b.image),
          body: parts.filter(Boolean).join("\n\n"),
          quote: pickStr(b.quote),
        } satisfies DailyBioBody;
      }
      return b as DailyBioBody;
    }
    case "daily_ads": {
      if (isV2Ads(b)) {
        return {
          items: ((b.items as any[]) || []).map((a) => ({
            title: pickStr(a.title) || "",
            desc: pickStr(a.desc),
            contact: pickStr(a.contact),
          })),
        } satisfies DailyAdsBody;
      }
      return b as DailyAdsBody;
    }
    default:
      return b;
  }
}

// Top-level helper: section.body → normalized body for a daily_* kind.
// Returns the original body for non-daily kinds.
export function normalizeBody(kind: SectionKind, body: unknown): unknown {
  if (kind.startsWith("daily_")) return normalizeDailyBody(kind, body);
  return body;
}
