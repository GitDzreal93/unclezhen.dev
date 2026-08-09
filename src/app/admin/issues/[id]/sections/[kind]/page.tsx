import { notFound } from "next/navigation";
import Link from "next/link";
import { getIssueForAdmin, getIssueSection } from "@/lib/data";
import { SECTION_KIND_LABEL, type SectionKind } from "@/lib/issues-types";
import SectionForm from "./SectionForm";

export const dynamic = "force-dynamic";

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string; kind: string }>;
}) {
  const { id, kind } = await params;
  const sectionKind = kind as SectionKind;
  if (!(SECTION_KIND_LABEL as any)[sectionKind]) notFound();
  const issue = await getIssueForAdmin(id);
  if (!issue) notFound();
  const section = await getIssueSection(id, sectionKind);
  if (!section) notFound();
  return (
    <>
      <div className="admin-head">
        <h1>编辑板块 · {SECTION_KIND_LABEL[sectionKind].zh}</h1>
        <Link className="btn btn--ghost btn--sm" href={`/admin/issues/${id}/sections`}>
          ← 板块列表
        </Link>
      </div>
      <p className="page-sub" style={{ marginBottom: 16 }}>
        <span className="mono">{issue.id}</span> · {section.kind} · {section.label}
      </p>
      <SectionForm
        issueId={id}
        sectionId={section.id}
        kind={sectionKind}
        initialBody={section.body}
        initialLabel={section.label}
        initialVisible={section.visible}
      />
    </>
  );
}
