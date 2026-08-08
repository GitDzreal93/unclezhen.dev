import Link from "next/link";
import { getBanners } from "@/lib/data";
import BannersTable from "./BannersTable";

export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const banners = await getBanners();
  return (
    <>
      <div className="admin-head">
        <h1>Banner</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/banners/new">
          + 新建 Banner
        </Link>
      </div>
      {banners.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有 Banner</div>
          <p className="admin-empty__desc">
            博客侧栏轮播的推广位，可配置图片与跳转链接。建议图片 280×160。
          </p>
          <Link className="btn btn--primary btn--sm" href="/admin/banners/new">
            + 新建 Banner
          </Link>
        </div>
      ) : (
        <BannersTable banners={banners} />
      )}
    </>
  );
}
