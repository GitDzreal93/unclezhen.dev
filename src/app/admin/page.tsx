import Link from "next/link";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { getOrders, getProducts } from "@/lib/data";
import { ADMIN_COOKIE, tokenExpiryMs } from "@/lib/auth";
import { t, type Locale } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/cookie";

export const dynamic = "force-dynamic";

async function counts() {
  const [posts, projects, products, orders, paid, cards] = await Promise.all([
    query<{ n: string }>("SELECT COUNT(*) n FROM posts"),
    query<{ n: string }>("SELECT COUNT(*) n FROM projects"),
    query<{ n: string }>("SELECT COUNT(*) n FROM products"),
    query<{ n: string }>("SELECT COUNT(*) n FROM orders"),
    query<{ n: string }>("SELECT COUNT(*) n FROM orders WHERE status='paid'"),
    query<{ n: string }>("SELECT COUNT(*) n FROM cards WHERE status='unused'"),
  ]);
  return {
    posts: +posts[0].n,
    projects: +projects[0].n,
    products: +products[0].n,
    orders: +orders[0].n,
    paid: +paid[0].n,
    cards: +cards[0].n,
  };
}

function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtExpiry(exp: number, locale: Locale): string {
  const d = new Date(exp);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (locale === "en") {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminDashboard() {
  const [c, orders, products, locale] = await Promise.all([
    counts(),
    getOrders(),
    getProducts(),
    getLocale(),
  ]);
  const recentOrders = orders.slice(0, 5);
  const inventory = products.slice(0, 5);

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const expiryMs = tokenExpiryMs(token);
  const sessionLabel = expiryMs
    ? `${t(locale, "admin.dashboard.session")} ${fmtExpiry(expiryMs, locale)}`
    : t(locale, "admin.dashboard.noSession");

  const stats = [
    { href: "/admin/products", num: c.products, label: t(locale, "admin.stat.product") },
    { href: "/admin/cards", num: c.cards, label: t(locale, "admin.stat.unusedCards") },
    { href: "/admin/orders", num: c.orders, label: t(locale, "admin.stat.totalOrders") },
    { href: "/admin/orders", num: c.paid, label: t(locale, "admin.stat.paidOrders") },
    { href: "/admin/posts", num: c.posts, label: t(locale, "admin.stat.blog") },
    { href: "/admin/projects", num: c.projects, label: t(locale, "admin.stat.project") },
  ];

  return (
    <>
      <div className="admin-head">
        <h1>{t(locale, "admin.dashboard.title")}</h1>
        <div className="admin-head__meta">
          <span>{today()}</span>
          <span aria-hidden="true">·</span>
          <span title={expiryMs ? new Date(expiryMs).toISOString() : ""}>
            {sessionLabel}
          </span>
        </div>
      </div>

      <div className="admin-stats">
        {stats.map((s, i) => (
          <Link key={i} className="admin-stat" href={s.href}>
            <div className="admin-stat__top">
              <span className="admin-stat__label">{s.label}</span>
              <span className="admin-stat__hint">→</span>
            </div>
            <div className="admin-stat__num">{s.num}</div>
          </Link>
        ))}
      </div>

      <div className="dash-grid" style={{ marginTop: 12 }}>
        <div className="dash-panel">
          <div className="dash-panel__head">
            <h2>{t(locale, "admin.dashboard.recentOrders")}</h2>
            <Link href="/admin/orders">{t(locale, "admin.dashboard.viewAll")}</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="admin-empty" style={{ border: "none", margin: 0 }}>
              {t(locale, "admin.dashboard.noOrders")}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">{t(locale, "admin.col.orderNo")}</th>
                    <th scope="col">{t(locale, "admin.col.product")}</th>
                    <th scope="col">{t(locale, "admin.col.amount")}</th>
                    <th scope="col">{t(locale, "admin.col.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.outTradeNo}>
                      <td className="mono">{o.outTradeNo}</td>
                      <td>
                        {o.productName}
                        {o.qty > 1 ? ` ×${o.qty}` : ""}
                      </td>
                      <td className="mono">¥{o.amount}</td>
                      <td>
                        <span
                          className={`admin-pill${o.status === "paid" ? " admin-pill--ok" : " admin-pill--warn"}`}
                        >
                          {o.status === "paid" ? t(locale, "admin.status.paid") : t(locale, "admin.status.pending")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dash-stack">
          <div className="dash-panel">
            <div className="dash-panel__head">
              <h2>{t(locale, "admin.dashboard.quick")}</h2>
            </div>
            <div className="dash-quick">
              <Link href="/admin/products/new">
                <span className="dash-quick__k">new</span>{t(locale, "admin.dashboard.quick.new")}
              </Link>
              <Link href="/admin/posts/new">
                <span className="dash-quick__k">post</span>{t(locale, "admin.dashboard.quick.post")}
              </Link>
              <Link href="/admin/cards">
                <span className="dash-quick__k">card</span>{t(locale, "admin.dashboard.quick.card")}
              </Link>
              <Link href="/admin/projects/new">
                <span className="dash-quick__k">proj</span>{t(locale, "admin.dashboard.quick.proj")}
              </Link>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel__head">
              <h2>{t(locale, "admin.dashboard.inventory")}</h2>
              <Link href="/admin/cards">{t(locale, "admin.dashboard.cardsLink")}</Link>
            </div>
            {inventory.length === 0 ? (
              <div className="admin-empty" style={{ border: "none", margin: 0 }}>
                {t(locale, "admin.dashboard.noOrders")}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t(locale, "admin.col.product")}</th>
                      <th scope="col">{t(locale, "admin.col.mode")}</th>
                      <th scope="col">{t(locale, "admin.col.stock")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          <span className="admin-pill">
                            {p.deliveryMode === "card" ? t(locale, "admin.mode.card") : t(locale, "admin.mode.fixed")}
                          </span>
                        </td>
                        <td className="mono">{p.stock < 0 ? "∞" : p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
