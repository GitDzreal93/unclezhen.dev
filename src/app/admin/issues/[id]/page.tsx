import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssueForAdmin } from "@/lib/data";
import IssueForm from "./IssueForm";
import DailyIssueForm from "./DailyIssueForm";

export const dynamic = "force-dynamic";

export default async function EditIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssueForAdmin(id);
  if (!issue) notFound();
  // daily-* issues get the v2.0 whole-issue editor; legacy issues keep the
  // per-section workflow.
  const isDaily =
    issue.id.startsWith("daily-") ||
    issue.sections.some((s) => s.kind.startsWith("daily_"));

  return (
    <>
      <div className="admin-head">
        <h1>编辑期刊</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            className="btn btn--ghost btn--sm"
            href={isDaily ? `/daily/${issue.id}` : `/weekly/${issue.id}`}
          >
            预览公开页
          </Link>
          <Link className="btn btn--primary btn--sm" href={`/admin/issues/${issue.id}/sections`}>
            管理板块 ({issue.sections.length})
          </Link>
        </div>
      </div>
      {isDaily ? <DailyIssueForm issue={issue} /> : <IssueForm issue={issue} isNew={false} />}
    </>
  );
}
