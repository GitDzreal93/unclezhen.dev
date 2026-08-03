import { getNavItems } from "@/lib/data";
import NavTable from "./NavTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "导航菜单 · 臻叔",
  robots: { index: false, follow: false },
};

export default async function AdminNav() {
  const items = await getNavItems();
  return (
    <>
      <div className="admin-head">
        <h1>导航菜单</h1>
      </div>
      <p className="page-sub">
        显示状态会立刻同步到顶部导航、首页模块卡与启动器站点地图（含内嵌游戏节点）。条目由 <code>scripts/setup-db.mjs</code> 维护，需要新增请改代码后跑 <code>npm run db:setup</code>。
      </p>
      <NavTable items={items} />
    </>
  );
}
