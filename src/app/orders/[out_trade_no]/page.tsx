import { getOrderByOutTradeNo, getVisibleNavItems } from "@/lib/data";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import OrderStatus from "./OrderStatus";
import "../orders.css";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ out_trade_no: string }>;
}) {
  const { out_trade_no } = await params;
  const [order, items, locale, theme] = await Promise.all([
    getOrderByOutTradeNo(out_trade_no),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);

  return (
    <>
      <SiteNav items={items} locale={locale} theme={theme} />
      <main id="main">
        <div className="wrap order-page">
          <div className="eyebrow">Order</div>
          <h1>{t(locale, "orders.heading")}</h1>
          {!order ? (
            <p className="lead">{t(locale, "orders.notFound", { code: out_trade_no })}</p>
          ) : (
            <OrderStatus
              outTradeNo={order.outTradeNo}
              initialStatus={order.status}
              productName={order.productName}
              qty={order.qty}
              amount={order.amount}
              email={order.email}
              deliveredContent={order.deliveredContent}
              locale={locale}
            />
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
