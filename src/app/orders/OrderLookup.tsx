"use client";

import { useState } from "react";

type Result = {
  outTradeNo: string;
  productName: string;
  qty: number;
  amount: number;
  status: "pending" | "paid";
  deliveredContent: string;
};

export default function OrderLookup() {
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
        setError(json.error || "查询失败");
        return;
      }
      setResult(json);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="order-lookup" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ot">订单号</label>
          <input id="ot" name="outTradeNo" required placeholder="U..." />
        </div>
        <div className="field">
          <label htmlFor="em">下单邮箱</label>
          <input id="em" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? "查询中…" : "查询"}
        </button>
        {error && <p className="admin-login__err" style={{ color: "oklch(72% 0.16 25)" }}>{error}</p>}
      </form>

      {result && (
        <div className="order-card card" style={{ marginTop: 24 }}>
          <div className="order-row">
            <span className="muted">商品</span>
            <span>
              {result.productName}
              {result.qty > 1 ? ` ×${result.qty}` : ""}
            </span>
          </div>
          <div className="order-row">
            <span className="muted">金额</span>
            <span className="mono">¥{result.amount}</span>
          </div>
          <div className="order-row">
            <span className="muted">状态</span>
            <span className={`tag${result.status === "paid" ? " tag--accent" : ""}`}>
              {result.status === "paid" ? "已支付" : "待支付"}
            </span>
          </div>
          {result.status === "paid" && (
            <div className="order-delivery">
              <h3>你的内容</h3>
              <pre className="order-content">{result.deliveredContent || "（发货内容为空，请联系站长）"}</pre>
            </div>
          )}
        </div>
      )}
    </>
  );
}
