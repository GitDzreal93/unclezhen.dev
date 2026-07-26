import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import OrderLookup from "./OrderLookup";
import "./orders.css";

export const metadata = {
  title: "订单查询 · 臻叔",
  description: "用订单号和邮箱找回已购内容。",
};

export default function OrdersLookupPage() {
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav />
      <main id="main">
        <div className="wrap order-page">
          <div className="eyebrow">Orders</div>
          <h1>订单查询</h1>
          <p className="lead">用订单号 + 下单邮箱找回已购内容。</p>
          <OrderLookup />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
