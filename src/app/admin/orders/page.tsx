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
      {orders.length === 0 ? (
        <div className="admin-empty">还没有订单。</div>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}