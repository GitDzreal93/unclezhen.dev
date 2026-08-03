"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n/dict";

export default function OrderStatus({
  outTradeNo,
  initialStatus,
  productName,
  qty,
  amount,
  email,
  deliveredContent,
  locale,
}: {
  outTradeNo: string;
  initialStatus: "pending" | "paid";
  productName: string;
  qty: number;
  amount: number;
  email: string;
  deliveredContent: string;
  locale: Locale;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [delivered, setDelivered] = useState(deliveredContent);

  // Poll while pending: the async notify may land a moment after the redirect.
  useEffect(() => {
    if (status === "paid") return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      try {
        const res = await fetch(`/api/orders/${outTradeNo}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            setStatus("paid");
            setDelivered(data.deliveredContent || "");
            clearInterval(timer);
          }
        }
      } catch {
        // keep polling
      }
      if (tries > 40) clearInterval(timer); // ~2 min then give up
    }, 3000);
    return () => clearInterval(timer);
  }, [status, outTradeNo]);

  return (
    <div className="order-card card">
      <div className="order-row">
        <span className="muted">{t(locale, "orders.outTradeNo")}</span>
        <span className="mono">{outTradeNo}</span>
      </div>
      <div className="order-row">
        <span className="muted">{t(locale, "orders.item.product")}</span>
        <span>
          {productName}
          {qty > 1 ? ` ×${qty}` : ""}
        </span>
      </div>
      <div className="order-row">
        <span className="muted">{t(locale, "orders.item.amount")}</span>
        <span className="mono">¥{amount}</span>
      </div>
      <div className="order-row">
        <span className="muted">{t(locale, "orders.email")}</span>
        <span className="mono">{email}</span>
      </div>
      <div className="order-row">
        <span className="muted">{t(locale, "orders.item.status")}</span>
        <span className={`tag${status === "paid" ? " tag--accent" : ""}`}>
          {status === "paid" ? t(locale, "orders.paid") : t(locale, "orders.pending")}
        </span>
      </div>

      {status === "paid" ? (
        <div className="order-delivery">
          <h3>{t(locale, "orders.delivery")}</h3>
          <pre className="order-content">{delivered || t(locale, "orders.deliveryEmpty")}</pre>
        </div>
      ) : (
        <p className="muted order-pending">
          {t(locale, "orders.pendingNote")}
          <a href="/orders"> {t(locale, "orders.heading")}</a> {t(locale, "orders.link")}.
        </p>
      )}
    </div>
  );
}
