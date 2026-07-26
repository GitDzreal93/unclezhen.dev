import { getOrderByOutTradeNo } from "@/lib/data";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import OrderStatus from "./OrderStatus";
import "../orders.css";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ out_trade_no: string }>;
}) {
  const { out_trade_no } = await params;
  const order = await getOrderByOutTradeNo(out_trade_no);

  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav />
      <main id="main">
        <div className="wrap order-page">
          <div className="eyebrow">Order</div>
          <h1>订单详情</h1>
          {!order ? (
            <p className="lead">找不到订单 {out_trade_no}。</p>
          ) : (
            <OrderStatus
              outTradeNo={order.outTradeNo}
              initialStatus={order.status}
              productName={order.productName}
              qty={order.qty}
              amount={order.amount}
              email={order.email}
              deliveredContent={order.deliveredContent}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
