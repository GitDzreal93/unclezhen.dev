import Link from "next/link";
import IssueForm from "../[id]/IssueForm";
import DailyIssueForm from "../[id]/DailyIssueForm";

// Two flavours share the /admin/issues area: 民国风周刊 (weekly) and 赛博日报
// v2.0 (daily). The daily editor is the default for new issues; the legacy
// per-section form remains reachable via ?style=weekly for the old kinds.
export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  if (style === "weekly") {
    return (
      <>
        <div className="admin-head">
          <h1>新建期刊（民国风）</h1>
          <Link className="btn btn--ghost btn--sm" href="/admin/issues/new">
            ← 赛博日报编辑器
          </Link>
        </div>
        <IssueForm isNew />
      </>
    );
  }
  return (
    <>
      <div className="admin-head">
        <h1>新建期刊（赛博日报）</h1>
        <Link className="btn btn--ghost btn--sm" href="/admin/issues/new?style=weekly">
          民国风周刊表单
        </Link>
      </div>
      <DailyIssueForm />
    </>
  );
}
