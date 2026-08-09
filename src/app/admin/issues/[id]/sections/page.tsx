import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssueForAdmin } from "@/lib/data";
import SectionList from "./SectionList";
import { SECTION_KIND_LABEL, type SectionKind } from "@/lib/issues-types";

export const dynamic = "force-dynamic";

export default async function IssueSectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssueForAdmin(id);
  if (!issue) notFound();

  const existingKinds = new Set(issue.sections.map((s) => s.kind));
  const availableKinds = (Object.keys(SECTION_KIND_LABEL) as SectionKind[])
    .filter((k) => !existingKinds.has(k));

  return (
    <>
      <div className="admin-head">
        <h1>期刊板块</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn btn--ghost btn--sm" href={`/admin/issues/${issue.id}`}>
            ← 期刊设置
          </Link>
          <Link className="btn btn--primary btn--sm" href={`/admin/issues/${issue.id}/sections/new`}>
            + 新增板块
          </Link>
        </div>
      </div>

      <p className="page-sub" style={{ marginBottom: 16 }}>
        <span className="mono">{issue.id}</span> · #{issue.issueNo} · {issue.title}
      </p>

      {issue.sections.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有板块</div>
          <p className="admin-empty__desc">先添加一个报头（Masthead）作为整版的视觉锚点。</p>
          <Link className="btn btn--primary btn--sm" href={`/admin/issues/${issue.id}/sections/new`}>
            + 新增板块
          </Link>
        </div>
      ) : (
        <SectionList
          issueId={issue.id}
          sections={issue.sections.map((s) => ({
            id: s.id,
            kind: s.kind,
            label: s.label,
            position: s.position,
            visible: s.visible,
          }))}
        />
      )}

      {availableKinds.length > 0 && issue.sections.length > 0 && (
        <div className="admin-form--panel" style={{ marginTop: 24, padding: 16 }}>
          <h3 style={{ marginBottom: 8, fontSize: 14 }}>未添加的板块</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            还可以加：{availableKinds.map((k) => SECTION_KIND_LABEL[k].zh).join("、")}
          </p>
        </div>
      )}
    </>
  );
}
