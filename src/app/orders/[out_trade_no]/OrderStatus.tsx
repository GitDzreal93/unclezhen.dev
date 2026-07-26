"use client";

import { useEffect, useState } from "react";

export default function OrderStatus({
  outTradeNo,
  initialStatus,
  productName,
  qty,
  amount,
  email,
  deliveredContent,
}: {
  outTradeNo: string;
  initialStatus: "pending" | "paid";
  productName: string;
  qty: number;
  amount: number;
  email: string;
  deliveredContent: string;
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
        <span className="muted">订单号</span>
        <span className="mono">{outTradeNo}</span>
      </div>
      <div className="order-row">
        <span className="muted">商品</span>
        <span>
          {productName}
          {qty > 1 ? ` ×${qty}` : ""}
        </span>
      </div>
      <div className="order-row">
        <span className="muted">金额</span>
        <span className="mono">¥{amount}</span>
      </div>
      <div className="order-row">
        <span className="muted">邮箱</span>
        <span className="mono">{email}</span>
      </div>
      <div className="order-row">
        <span className="muted">状态</span>
        <span className={`tag${status === "paid" ? " tag--accent" : ""}`}>
          {status === "paid" ? "已支付" : "待支付"}
        </span>
      </div>

      {status === "paid" ? (
        <div className="order-delivery">
          <h3>你的内容</h3>
          <pre className="order-content">{delivered || "（发货内容为空，请联系站长）"}</pre>
        </div>
      ) : (
        <p className="muted order-pending">
          若已完成支付，稍等片刻页面会自动刷新出发货内容。也可保存订单号，稍后到
          <a href="/orders"> 订单查询</a> 找回。
        </p>
      )}
    </div>
  );
}
