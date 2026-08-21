import { revalidatePath } from "next/cache";
import { ContentApiError } from "./content-api";
import { query } from "./db";
import { SECTION_KIND_LABEL, type SectionKind } from "./issues-types";
import type { Issue, IssueWithSections } from "./data";

// External-API layer for issues (赛博日报 v2.0). The public site reads via
// lib/data.ts; this module powers POST/PATCH/DELETE /api/v1/issues with
// whole-issue payloads: one JSON in, one issue upserted.

const DAILY_KIND_SET = new Set<string>([
  "daily_news", "daily_ranks", "daily_oss", "daily_side", "daily_know", "daily_bio", "daily_ads",
]);

const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type IssueUpsertInput = {
  id: string;
  issueNo: number;
  title: string;
  weather: string;
  publishedAt: string;
  visible: boolean;
  sections: { kind: SectionKind; body: Record<string, unknown> }[];
};

// Validate an untrusted whole-issue payload. Throws ContentApiError with a
// precise message per problem — the API caller (an AI pipeline) needs to know
// exactly which field to fix.
export function validateIssuePayload(payload: unknown): IssueUpsertInput {
  if (typeof payload !== "object" || payload === null) {
    throw new ContentApiError("validation_error", "请求体必须是 JSON 对象");
  }
  const p = payload as Record<string, unknown>;

  const id = typeof p.id === "string" ? p.id.trim() : "";
  if (!ID_RE.test(id)) {
    throw new ContentApiError("validation_error", "id 必须是 1-80 位的 小写字母/数字/连字符（建议 daily-YYYY-MM-DD）");
  }
  const issueNo = Number(p.issueNo);
  if (!Number.isInteger(issueNo) || issueNo < 1 || issueNo > 99999) {
    throw new ContentApiError("validation_error", "issueNo 必须是 1-99999 的整数");
  }
  const title = typeof p.title === "string" ? p.title.trim() : "";
  if (!title) throw new ContentApiError("validation_error", "title 必填");
  const publishedAt = typeof p.publishedAt === "string" ? p.publishedAt.trim() : "";
  if (!DATE_RE.test(publishedAt)) {
    throw new ContentApiError("validation_error", "publishedAt 必须是 YYYY-MM-DD");
  }
  const weather = typeof p.weather === "string" ? p.weather.trim().slice(0, 120) : "";
  // Draft by default — the AI pipeline stages, a human publishes.
  const visible = p.visible === true;

  let sections: IssueUpsertInput["sections"] = [];
  if (p.sections !== undefined) {
    if (!Array.isArray(p.sections)) {
      throw new ContentApiError("validation_error", "sections 必须是数组（留空板块直接不传）");
    }
    const seen = new Set<string>();
    sections = p.sections.map((raw, i) => {
      if (typeof raw !== "object" || raw === null) {
        throw new ContentApiError("validation_error", `sections[${i}] 必须是对象`);
      }
      const s = raw as Record<string, unknown>;
      const kind = typeof s.kind === "string" ? s.kind : "";
      if (!DAILY_KIND_SET.has(kind)) {
        throw new ContentApiError(
          "validation_error",
          `sections[${i}].kind 非法：${kind}。合法值：${[...DAILY_KIND_SET].join(" / ")}`,
        );
      }
      if (seen.has(kind)) {
        throw new ContentApiError("validation_error", `板块重复：${kind}`);
      }
      seen.add(kind);
      if (typeof s.body !== "object" || s.body === null) {
        throw new ContentApiError("validation_error", `sections[${i}].body 必须是对象`);
      }
      return { kind: kind as SectionKind, body: s.body as Record<string, unknown> };
    });
  }

  return { id, issueNo, title, weather, publishedAt, visible, sections };
}

// Upsert one issue + replace its daily_* sections wholesale (transactional).
// Returns the saved issue with sections, shaped like the public reader sees.
export async function upsertIssueWithSections(input: IssueUpsertInput): Promise<IssueWithSections> {
  // issue_no is UNIQUE across all issues — map the conflict to a clean 409.
  const clash = await query<any>(
    "SELECT id FROM issues WHERE issue_no=$1 AND id<>$2 LIMIT 1",
    [input.issueNo, input.id],
  );
  if (clash.length) {
    throw new ContentApiError("conflict", `期号 ${input.issueNo} 已被期刊 ${clash[0].id} 占用`);
  }

  await query(
    `INSERT INTO issues (id, issue_no, title, cover_image, weather, published_at, visible)
       VALUES ($1,$2,$3,'',$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       issue_no=EXCLUDED.issue_no, title=EXCLUDED.title, weather=EXCLUDED.weather,
       published_at=EXCLUDED.published_at, visible=EXCLUDED.visible`,
    [input.id, input.issueNo, input.title, input.weather, input.publishedAt, input.visible],
  );

  await query("DELETE FROM issue_sections WHERE issue_id=$1 AND kind LIKE 'daily_%'", [input.id]);
  for (let i = 0; i < input.sections.length; i++) {
    const s = input.sections[i];
    const label = SECTION_KIND_LABEL[s.kind]?.zh || s.kind;
    await query(
      `INSERT INTO issue_sections (id, issue_id, kind, label, position, body, visible)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,true)
       ON CONFLICT (issue_id, kind) DO UPDATE SET
         label=EXCLUDED.label, position=EXCLUDED.position, body=EXCLUDED.body, visible=true`,
      [`${input.id}/${s.kind}`, input.id, s.kind, label, i, JSON.stringify(s.body)],
    );
  }

  revalidatePath("/daily");
  revalidatePath(`/daily/${input.id}`);
  revalidatePath("/admin/issues");
  revalidatePath(`/admin/issues/${input.id}`);

  const saved = await getIssueWithSectionsForApi(input.id);
  if (!saved) throw new Error("issue upsert succeeded but re-read failed");
  return saved;
}

export async function getIssueWithSectionsForApi(id: string): Promise<IssueWithSections | null> {
  const rows = await query<any>(
    "SELECT id,issue_no,title,cover_image,weather,published_at,visible,created_at FROM issues WHERE id=$1",
    [id],
  );
  if (!rows.length) return null;
  const sectionRows = await query<any>(
    "SELECT id,issue_id,kind,label,position,body,visible FROM issue_sections WHERE issue_id=$1 ORDER BY position ASC",
    [id],
  );
  const mapIssue = (r: any): Issue => ({
    id: r.id, issueNo: r.issue_no, title: r.title, coverImage: r.cover_image ?? "",
    weather: r.weather ?? "", publishedAt: fmtDate(r.published_at),
    visible: r.visible, createdAt: String(r.created_at ?? ""),
  });
  return {
    ...mapIssue(rows[0]),
    sections: sectionRows.map((r: any) => ({
      id: r.id, issueId: r.issue_id, kind: r.kind, label: r.label,
      position: r.position, body: r.body, visible: r.visible,
    })),
  };
}

function fmtDate(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return String(d ?? "");
}
