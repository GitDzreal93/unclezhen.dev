import Link from "next/link";
import { getSeriesWithCounts } from "@/lib/data";
import SeriesTable from "./SeriesTable";

export const dynamic = "force-dynamic";

export default async function AdminSeries() {
  const series = await getSeriesWithCounts();
  return (
    <>
      <div className="admin-head">
        <h1>合集</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/series/new">
          + 新建合集
        </Link>
      </div>
      {series.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有合集</div>
          <p className="admin-empty__desc">
            把多篇相关文章归入一个合集，读者可按合集浏览，合集内文章可拖拽排序。
          </p>
          <Link className="btn btn--primary btn--sm" href="/admin/series/new">
            + 新建合集
          </Link>
        </div>
      ) : (
        <SeriesTable series={series} />
      )}
    </>
  );
}
