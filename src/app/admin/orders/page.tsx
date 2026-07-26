import { getOrders } from "@/lib/data";
import OrdersTable from "./OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await getOrders();
  return (
    <>
      <div className="admin-head">
        <h1>订单</h1>
      </div>
      <p className="page-sub">补发内容或手动标记已付。敏感字段以等宽显示。</p>
      {orders.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">还没有订单</div>
          <p className="admin-empty__desc">买家支付后订单会出现在这里。</p>
        </div>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}