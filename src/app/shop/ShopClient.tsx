"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/data";
import Modal from "@/components/Modal";
import { toast } from "@/components/toast";
import { t, type Locale } from "@/lib/i18n/dict";

export default function ShopClient({ products, locale }: { products: Product[]; locale: Locale }) {
  const allFilter = t(locale, "shop.allFilter");
  const [active, setActive] = useState(allFilter);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cats = useMemo(() => {
    const s = new Set<string>([allFilter]);
    products.forEach((p) => s.add(p.cat));
    return Array.from(s);
  }, [products, allFilter]);

  const list = useMemo(
    () => products.filter((p) => active === allFilter || p.cat === active),
    [products, active, allFilter]
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
    toast(t(locale, "shop.toast.added"));
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error || `Order failed (HTTP ${res.status})`);
      }
      setCart({});
      setCheckoutOpen(false);
      toast(t(locale, "shop.toast.ordered"));
      form.reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : t(locale, "shop.failGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const ids = Object.keys(cart);

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">{t(locale, "shop.eyebrow")}</div>
        <h1>{t(locale, "shop.heading")}</h1>
        <p className="lead">{t(locale, "shop.lead")}</p>
        <div className="toolbar">
          <div className="filters">
            {cats.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-btn${cat === active ? " is-active" : ""}`}
                onClick={() => setActive(cat)}
              >
                {cat}
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
                    {t(locale, "shop.addToCart")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className={`cart-panel${cartOpen ? " is-open" : ""}`} aria-label={t(locale, "shop.cart.title")}>
          <h2>{t(locale, "shop.cart.title")}</h2>
          <div className="cart-items">
            {ids.length === 0 ? (
              <p className="cart-empty">{t(locale, "shop.cart.empty")}</p>
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
                      <button type="button" aria-label={t(locale, "shop.qty.dec")} onClick={() => setQty(id, cart[id] - 1)}>−</button>
                      <span className="mono">{cart[id]}</span>
                      <button type="button" aria-label={t(locale, "shop.qty.inc")} onClick={() => setQty(id, cart[id] + 1)}>+</button>
                    </div>
                    <button
                      type="button"
                      aria-label={t(locale, "shop.qty.remove")}
                      style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                      onClick={() => setQty(id, 0)}
                    >
                      {t(locale, "shop.qty.remove")}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="cart-total">
            <span>{t(locale, "shop.cart.total")}</span>
            <strong className="mono">¥{totals.sum}</strong>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            style={{ width: "100%" }}
            disabled={totals.count === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            {t(locale, "shop.cart.checkout")}
          </button>
          <p className="muted" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>
            {t(locale, "shop.cart.demo")}
          </p>
        </aside>
      </div>

      <button
        className="fab-cart"
        type="button"
        aria-label={t(locale, "shop.cart.title")}
        onClick={() => setCartOpen((v) => !v)}
      >
        {t(locale, "shop.cart.title")} <span className="badge">{totals.count}</span>
      </button>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} labelledBy="co-title">
        <h3 id="co-title">{t(locale, "shop.checkout.title")}</h3>
        <p>{t(locale, "shop.checkout.desc", { count: totals.count, sum: totals.sum })}</p>
        <form onSubmit={onCheckout}>
          <div className="field">
            <label htmlFor="co-mail">{t(locale, "shop.checkout.email")}</label>
            <input id="co-mail" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="modal__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setCheckoutOpen(false)}>
              {t(locale, "shop.checkout.cancel")}
            </button>
            <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
              {t(locale, "shop.checkout.confirm")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
