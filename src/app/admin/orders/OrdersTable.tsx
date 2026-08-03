"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/data";
import { markOrderPaid, deleteOrder } from "@/lib/admin";
import DeleteButton from "../DeleteButton";
import { toast } from "@/components/toast";

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [delivered, setDelivered] = useState("");
  const [pending, startTransition] = useTransition();
  const [errBanner, setErrBanner] = useState("");

  function openFix(o: Order) {
    setEditing(o.outTradeNo);
    setDelivered(o.deliveredContent);
    setErrBanner("");
  }

  function submitFix(outTradeNo: string) {
    const fd = new FormData();
    fd.set("outTradeNo", outTradeNo);
    fd.set("deliveredContent", delivered);
    startTransition(async () => {
      try {
        await markOrderPaid(fd);
        setEditing(null);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "保存失败";
        setErrBanner(msg);
        toast(msg);
      }
    });
  }

  return (
    <div className="table-wrap">
      {errBanner && (
        <p className="admin-login__err" style={{ margin: "0 0 12px" }}>
          {errBanner}
        </p>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">订单号</th>
            <th scope="col">商品</th>
            <th scope="col">邮箱</th>
            <th scope="col">金额</th>
            <th scope="col">状态</th>
            <th scope="col">发货内容</th>
            <th scope="col"><span className="sr-only">操作</span></th>
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
                  <div className="admin-actions">
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => openFix(o)}>
                      补发/改
                    </button>
                    <DeleteButton
                      id={o.outTradeNo}
                      action={deleteOrder}
                      confirm={
                        o.status === "paid"
                          ? `删除已支付订单「${o.outTradeNo}」？该操作不可撤销，已售卡密将解除关联。`
                          : `删除待支付订单「${o.outTradeNo}」？该操作不可撤销。`
                      }
                      label="删除"
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}