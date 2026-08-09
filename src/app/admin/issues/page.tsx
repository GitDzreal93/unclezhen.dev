import Link from "next/link";
import { getIssuesForAdmin } from "@/lib/data";
import IssuesTable from "./IssuesTable";

export const dynamic = "force-dynamic";

export default async function AdminIssues() {
  const issues = await getIssuesForAdmin();
  return (
    <>
      <div className="admin-head">
        <h1>期刊</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/issues/new">
          + 新建期刊
        </Link>
      </div>
      {issues.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有期刊</div>
          <p className="admin-empty__desc">建第一期，每个板块独立编辑。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/issues/new">
            + 新建期刊
          </Link>
        </div>
      ) : (
        <IssuesTable issues={issues} />
      )}
    </>
  );
}
