"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SeriesWithCount } from "@/lib/data";
import { setSeriesShowNumber, deleteSeries } from "@/lib/admin";
import { toast } from "@/components/toast";
import DeleteButton from "../DeleteButton";

// Optimistic toggle for the "show post numbers" flag, mirroring NavTable's
// VisibilityCell: flip locally, sync via action, revert + toast on failure.
function ShowNumberCell({ series }: { series: SeriesWithCount }) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const on = optimistic !== null ? optimistic : series.showNumber;

  function flip(next: boolean) {
    if (pending || on === next) return;
    setOptimistic(next);
    const fd = new FormData();
    fd.set("id", series.id);
    fd.set("showNumber", String(next));
    startTransition(async () => {
      try {
        await setSeriesShowNumber(fd);
        router.refresh();
      } catch (err) {
        setOptimistic(null);
        toast(err instanceof Error ? err.message : "切换失败");
      }
    });
  }

  return (
    <div className="seg" role="radiogroup" aria-label={`${series.title} 序号显示`}>
      <label>
        <input
          type="radio"
          name={`sn-${series.id}`}
          value="true"
          checked={on}
          onChange={() => flip(true)}
          disabled={pending}
        />{" "}
        显示
      </label>
      <label>
        <input
          type="radio"
          name={`sn-${series.id}`}
          value="false"
          checked={!on}
          onChange={() => flip(false)}
          disabled={pending}
        />{" "}
        隐藏
      </label>
    </div>
  );
}

export default function SeriesTable({ series }: { series: SeriesWithCount[] }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">名称</th>
            <th scope="col" style={{ width: 80 }}>文章数</th>
            <th scope="col" style={{ width: 160 }}>序号显示</th>
            <th scope="col"><span className="sr-only">操作</span></th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.id}>
              <td className="mono">{s.id}</td>
              <td>{s.title}</td>
              <td className="mono">{s.postCount}</td>
              <td><ShowNumberCell series={s} /></td>
              <td>
                <div className="admin-actions">
                  <Link className="btn btn--ghost btn--sm" href={`/admin/series/${s.id}`}>
                    编辑
                  </Link>
                  <DeleteButton
                    id={s.id}
                    action={deleteSeries}
                    confirm={`删除合集「${s.title}」？合集内的文章不会被删除，只是移出合集。`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
