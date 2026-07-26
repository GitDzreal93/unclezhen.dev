"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/data";
import { markOrderPaid } from "@/lib/admin";

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [delivered, setDelivered] = useState("");
  const [pending, startTransition] = useTransition();

  function openFix(o: Order) {
    setEditing(o.outTradeNo);
    setDelivered(o.deliveredContent);
  }

  function submitFix(outTradeNo: string) {
    const fd = new FormData();
    fd.set("outTradeNo", outTradeNo);
    fd.set("deliveredContent", delivered);
    startTransition(async () => {
      await markOrderPaid(fd);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>订单号</th>
          <th>商品</th>
          <th>邮箱</th>
          <th>金额</th>
          <th>状态</th>
          <th>发货内容</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.outTradeNo}>
            <td className="mono">{o.outTradeNo}</td>
            <td>
              {o.productName}
              {o.qty > 1 ? ` ×${o.qty}` : ""}
            </td>
            <td className="mono">{o.email}</td>
            <td className="mono">¥{o.amount}</td>
            <td>
              <span className={`admin-pill${o.status === "paid" ? " admin-pill--ok" : " admin-pill--warn"}`}>
                {o.status === "paid" ? "已支付" : "待支付"}
              </span>
            </td>
            <td className="mono" style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
              {editing === o.outTradeNo ? (
                <textarea
                  value={delivered}
                  onChange={(e) => setDelivered(e.target.value)}
                  style={{ width: "100%", minHeight: 60 }}
                />
              ) : (
                o.deliveredContent || "—"
              )}
            </td>
            <td>
              {editing === o.outTradeNo ? (
                <div className="admin-actions">
                  <button className="btn btn--primary btn--sm" type="button" onClick={() => submitFix(o.outTradeNo)} disabled={pending}>
                    {pending ? "…" : "保存并标记已付"}
                  </button>
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => setEditing(null)}>
                    取消
                  </button>
                </div>
              ) : (
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => openFix(o)}>
                  补发/改
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}