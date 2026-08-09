import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getIssueForAdmin } from "@/lib/data";
import { SECTION_KIND_LABEL, type SectionKind } from "@/lib/issues-types";
import { createIssueSection } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const issue = await getIssueForAdmin(id);
  if (!issue) notFound();

  // No kind picked yet: show the picker.
  if (!sp.kind) {
    const existingKinds = new Set(issue.sections.map((s) => s.kind));
    const available = (Object.keys(SECTION_KIND_LABEL) as SectionKind[])
      .filter((k) => !existingKinds.has(k));
    return (
      <>
        <div className="admin-head">
          <h1>选择板块类型</h1>
          <Link className="btn btn--ghost btn--sm" href={`/admin/issues/${id}/sections`}>
            ← 板块列表
          </Link>
        </div>
        {available.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__title">所有类型都已添加</div>
            <p className="admin-empty__desc">每个期刊最多 9 种板块。要修改已有的，请回板块列表编辑。</p>
          </div>
        ) : (
          <form className="admin-form admin-form--panel" method="get">
            <div className="field">
              <label>板块类型</label>
              <select name="kind" className="select" defaultValue={available[0]}>
                {available.map((k) => (
                  <option key={k} value={k}>
                    {SECTION_KIND_LABEL[k].zh} ({k})
                  </option>
                ))}
              </select>
              <span className="field-hint">先选类型，再点"创建"进入编辑器</span>
            </div>
            <div className="admin-form__actions">
              <button type="submit" className="btn btn--primary btn--sm">
                下一步
              </button>
            </div>
          </form>
        )}
      </>
    );
  }

  // Kind selected via ?kind=... — create the section, then redirect to its editor.
  const kind = sp.kind as SectionKind;
  if (!(SECTION_KIND_LABEL as any)[kind]) {
    return (
      <div className="admin-empty">
        <div className="admin-empty__title">未知板块类型</div>
        <p className="admin-empty__desc">{kind}</p>
      </div>
    );
  }
  const fd = new FormData();
  fd.set("issueId", id);
  fd.set("kind", kind);
  await createIssueSection(fd);
  redirect(`/admin/issues/${id}/sections/${kind}`);
}
