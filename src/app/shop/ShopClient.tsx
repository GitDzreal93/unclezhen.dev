"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/data";
import Modal from "@/components/Modal";
import { toast } from "@/components/toast";

export default function ShopClient({ products }: { products: Product[] }) {
  const [active, setActive] = useState("全部");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cats = useMemo(() => {
    const s = new Set<string>(["全部"]);
    products.forEach((p) => s.add(p.cat));
    return Array.from(s);
  }, [products]);

  const list = useMemo(
    () => products.filter((p) => active === "全部" || p.cat === active),
    [products, active]
  );

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const totals = useMemo(() => {
    let count = 0;
    let sum = 0;
    for (const id of Object.keys(cart)) {
      const p = productMap.get(id);
      if (!p) continue;
      count += cart[id];
      sum += cart[id] * p.price;
    }
    return { count, sum };
  }, [cart, productMap]);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    toast("已加入购物车");
  }

  function setQty(id: string, n: number) {
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  }

  async function onCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const items = Object.keys(cart).map((id) => ({ id, qty: cart[id] }));
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), items }),
      });
      if (!res.ok) throw new Error("failed");
      setCart({});
      setCheckoutOpen(false);
      toast("下单成功（演示）");
      form.reset();
    } catch {
      toast("下单失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  const ids = Object.keys(cart);

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">Shop</div>
        <h1>软件与模板</h1>
        <p className="lead">
          可直接购买的源码包、模板与小工具。购物车与结算为可交互原型，订单会写入数据库。
        </p>
        <div className="toolbar">
          <div className="filters">
            {cats.map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-btn${t === active ? " is-active" : ""}`}
                onClick={() => setActive(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="wrap shop-layout" id="products">
        <div className="grid-2">
          {list.map((p) => (
            <article key={p.id} className="card product">
              <div className="ph"><span>{p.cat}</span></div>
              <div className="card__body">
                <div className="card__meta">
                  <span className="tag">{p.cat}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="muted" style={{ fontSize: 14 }}>{p.descr}</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <div className="price">¥{p.price}</div>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => add(p.id)}
                  >
                    加入购物车
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className={`cart-panel${cartOpen ? " is-open" : ""}`} aria-label="购物车">
          <h2>购物车</h2>
          <div className="cart-items">
            {ids.length === 0 ? (
              <p className="cart-empty">购物车是空的，挑一件模板或源码吧。</p>
            ) : (
              ids.map((id) => {
                const p = productMap.get(id)!;
                return (
                  <div key={id} className="cart-item">
                    <div>
                      {p.name}
                      <div className="muted mono" style={{ fontSize: 12 }}>¥{p.price}</div>
                    </div>
                    <div className="qty">
                      <button type="button" aria-label="减少" onClick={() => setQty(id, cart[id] - 1)}>−</button>
                      <span className="mono">{cart[id]}</span>
                      <button type="button" aria-label="增加" onClick={() => setQty(id, cart[id] + 1)}>+</button>
                    </div>
                    <button
                      type="button"
                      aria-label="移除"
                      style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                      onClick={() => setQty(id, 0)}
                    >
                      移除
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="cart-total">
            <span>合计</span>
            <strong className="mono">¥{totals.sum}</strong>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            style={{ width: "100%" }}
            disabled={totals.count === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            去结算
          </button>
          <p className="muted" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>
            演示环境：点击结算会创建一条订单记录，不接真实支付。
          </p>
        </aside>
      </div>

      <button
        className="fab-cart"
        type="button"
        aria-label="打开购物车"
        onClick={() => setCartOpen((v) => !v)}
      >
        购物车 <span className="badge">{totals.count}</span>
      </button>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} labelledBy="co-title">
        <h3 id="co-title">确认结算</h3>
        <p>共 {totals.count} 件，合计 ¥{totals.sum}。此为演示下单。</p>
        <form onSubmit={onCheckout}>
          <div className="field">
            <label htmlFor="co-mail">接收下载链接的邮箱</label>
            <input id="co-mail" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="modal__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setCheckoutOpen(false)}>
              再想想
            </button>
            <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
              确认下单（演示）
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
