// 一次性迁移脚本：把 issues_sections 里 daily_* 行的 body 从 v2 形状
// 转换为 v3（markdown 形态）。已迁移过的行（body 已经是 v3 形状）会被
// 跳过，脚本可重跑。
//
// 旧 v2 形状（识别特征）：
//   daily_news: paragraphs[] + kicker/title/subtitle/imageCaption
//   daily_ranks: boards[].color 字段
//   daily_oss: paragraphs[] + rank/tagline/title/meta
//   daily_side: items[] of { title, desc, tag }（无 body）
//   daily_know: paragraphs[] + title/subtitle/summary
//   daily_bio: paragraphs[] + signature/enMeta/chapter
//   daily_ads: items[] of { type, ... }
//
// 新 v3 形状（issues-types.ts）：见各 Daily*Body。
//
// 运行：node scripts/migrate-daily-to-md.mjs

import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.POSTGRES_DSN });

// ---- 形状嗅探 ----

const isV2 = {
  daily_news: (b) => b && Array.isArray(b.paragraphs),
  daily_ranks: (b) => b && Array.isArray(b.boards) && b.boards.some((x) => x && "color" in (x || {})),
  daily_oss: (b) => b && Array.isArray(b.paragraphs) && ("rank" in b || "tagline" in b || "title" in b),
  daily_side: (b) => b && Array.isArray(b.items) && b.items.every((x) => x && ("desc" in x || "tag" in x)) && !("body" in b),
  daily_know: (b) => b && Array.isArray(b.paragraphs) && ("title" in b || "summary" in b),
  daily_bio: (b) => b && Array.isArray(b.paragraphs) && ("signature" in b || "enMeta" in b || "chapter" in b),
  daily_ads: (b) => b && Array.isArray(b.items) && b.items.some((x) => x && "type" in x),
};

function joinParas(paras) {
  if (!Array.isArray(paras)) return "";
  return paras.filter(Boolean).join("\n\n");
}

function v2ToV3(kind, b) {
  switch (kind) {
    case "daily_news": {
      const parts = [];
      if (b.title) parts.push(`## ${String(b.title).trim()}`);
      if (b.subtitle) parts.push(`**${String(b.subtitle).trim()}**`);
      if (Array.isArray(b.paragraphs)) parts.push(joinParas(b.paragraphs));
      return {
        image: b.image || undefined,
        body: parts.filter(Boolean).join("\n\n"),
        wire: Array.isArray(b.wire) ? b.wire.filter((w) => w && w.text) : [],
      };
    }
    case "daily_ranks": {
      return {
        intro: b.intro || undefined,
        boards: (b.boards || []).map((brd) => ({
          name: brd.name,
          source: brd.source || undefined,
          items: (brd.items || []).map((it) => ({
            name: it.name,
            value: it.value,
            desc: it.desc || undefined,
            url: it.url || undefined,
          })),
          note: brd.note || undefined,
        })),
      };
    }
    case "daily_oss": {
      return {
        body: joinParas(b.paragraphs),
        stats: Array.isArray(b.stats) ? b.stats : [],
      };
    }
    case "daily_side": {
      const items = (b.items || []).filter((it) => it && (it.title || it.desc));
      return {
        body: items
          .map((it) => `- **${it.title || ""}** — ${it.desc || ""}${it.tag ? ` _(${it.tag})_` : ""}`)
          .join("\n"),
      };
    }
    case "daily_know": {
      const parts = [];
      if (b.title) parts.push(`## ${String(b.title).trim()}`);
      if (b.subtitle) parts.push(`*${String(b.subtitle).trim()}*`);
      if (Array.isArray(b.paragraphs)) parts.push(joinParas(b.paragraphs));
      if (b.summary) parts.push(`> **小结**：${String(b.summary).trim()}`);
      return {
        body: parts.filter(Boolean).join("\n\n"),
        code: b.code || undefined,
      };
    }
    case "daily_bio": {
      const parts = [];
      if (b.title) parts.push(`## ${String(b.title).trim()}`);
      if (b.enMeta) parts.push(`*${String(b.enMeta).trim()}*`);
      if (Array.isArray(b.paragraphs)) parts.push(joinParas(b.paragraphs));
      return {
        image: b.image || undefined,
        body: parts.filter(Boolean).join("\n\n"),
        quote: b.quote || undefined,
      };
    }
    case "daily_ads": {
      return {
        items: (b.items || []).map((a) => ({
          title: a.title,
          desc: a.desc || undefined,
          contact: a.contact || undefined,
        })),
      };
    }
    default:
      return b;
  }
}

async function main() {
  const { rows } = await pool.query(
    `SELECT id, kind, body FROM issue_sections WHERE kind LIKE 'daily_%' ORDER BY issue_id, position`
  );
  console.log(`Found ${rows.length} daily_* sections`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    let body = row.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (!body || typeof body !== "object") {
      skipped++;
      continue;
    }
    const detect = isV2[row.kind];
    if (!detect) {
      skipped++;
      continue;
    }
    if (!detect(body)) {
      // already v3
      skipped++;
      continue;
    }
    try {
      const newBody = v2ToV3(row.kind, body);
      await pool.query(
        `UPDATE issue_sections SET body = $1::jsonb WHERE id = $2`,
        [JSON.stringify(newBody), row.id]
      );
      console.log(`  ✓ ${row.id} (${row.kind}) migrated`);
      migrated++;
    } catch (e) {
      console.error(`  ✗ ${row.id} (${row.kind}) failed: ${e.message}`);
      errors++;
    }
  }

  console.log("");
  console.log(`Done. migrated=${migrated} skipped=${skipped} errors=${errors}`);
  await pool.end();
  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
