"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n/dict";

type Result = {
  outTradeNo: string;
  productName: string;
  qty: number;
  amount: number;
  status: "pending" | "paid";
  deliveredContent: string;
};

export default function OrderLookup({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult(null);
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outTradeNo: data.get("outTradeNo"),
          email: data.get("email"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t(locale, "orders.failGeneric"));
        return;
      }
      setResult(json);
    } catch {
      setError(t(locale, "orders.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="order-lookup" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ot">{t(locale, "orders.outTradeNo")}</label>
          <input id="ot" name="outTradeNo" required placeholder="U..." />
        </div>
        <div className="field">
          <label htmlFor="em">{t(locale, "orders.email")}</label>
          <input id="em" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? t(locale, "orders.submitting") : t(locale, "orders.submit")}
        </button>
        {error && <p className="admin-login__err" style={{ color: "var(--danger)" }}>{error}</p>}
      </form>

      {result && (
        <div className="order-card card" style={{ marginTop: 24 }}>
          <div className="order-row">
            <span className="muted">{t(locale, "orders.item.product")}</span>
            <span>
              {result.productName}
              {result.qty > 1 ? ` ×${result.qty}` : ""}
            </span>
          </div>
          <div className="order-row">
            <span className="muted">{t(locale, "orders.item.amount")}</span>
            <span className="mono">¥{result.amount}</span>
          </div>
          <div className="order-row">
            <span className="muted">{t(locale, "orders.item.status")}</span>
            <span className={`tag${result.status === "paid" ? " tag--accent" : ""}`}>
              {result.status === "paid" ? t(locale, "orders.paid") : t(locale, "orders.pending")}
            </span>
          </div>
          {result.status === "paid" && (
            <div className="order-delivery">
              <h3>{t(locale, "orders.delivery")}</h3>
              <pre className="order-content">{result.deliveredContent || t(locale, "orders.deliveryEmpty")}</pre>
            </div>
          )}
        </div>
      )}
    </>
  );
}
