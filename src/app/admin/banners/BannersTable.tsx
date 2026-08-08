"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminBanner } from "@/lib/data";
import { setBannerVisibility, deleteBanner } from "@/lib/admin";
import { toast } from "@/components/toast";
import DeleteButton from "../DeleteButton";

function VisibilityCell({ banner }: { banner: AdminBanner }) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const on = optimistic !== null ? optimistic : banner.visible;

  function flip(next: boolean) {
    if (pending || on === next) return;
    setOptimistic(next);
    const fd = new FormData();
    fd.set("id", banner.id);
    fd.set("visible", String(next));
    startTransition(async () => {
      try {
        await setBannerVisibility(fd);
        router.refresh();
      } catch (err) {
        setOptimistic(null);
        toast(err instanceof Error ? err.message : "切换失败");
      }
    });
  }

  return (
    <div className="seg" role="radiogroup" aria-label={`${banner.id} 显隐`}>
      <label>
        <input
          type="radio"
          name={`bn-${banner.id}`}
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
          name={`bn-${banner.id}`}
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

export default function BannersTable({ banners }: { banners: AdminBanner[] }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">预览</th>
            <th scope="col">跳转链接</th>
            <th scope="col" style={{ width: 160 }}>显示</th>
            <th scope="col"><span className="sr-only">操作</span></th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => (
            <tr key={b.id}>
              <td className="mono">{b.id}</td>
              <td>
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  style={{ width: 100, height: 57, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)" }}
                />
              </td>
              <td className="mono">{b.linkUrl || "—"}</td>
              <td><VisibilityCell banner={b} /></td>
              <td>
                <div className="admin-actions">
                  <Link className="btn btn--ghost btn--sm" href={`/admin/banners/${b.id}`}>
                    编辑
                  </Link>
                  <DeleteButton
                    id={b.id}
                    action={deleteBanner}
                    confirm={`删除 Banner「${b.id}」？`}
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
