import Link from "next/link";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { getOrders, getProducts } from "@/lib/data";
import { ADMIN_COOKIE, tokenExpiryMs } from "@/lib/auth";

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

// YYYY-MM-DD in a stable way (no locale surprises).
function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtExpiry(exp: number): string {
  const d = new Date(exp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminDashboard() {
  const [c, orders, products] = await Promise.all([
    counts(),
    getOrders(),
    getProducts(),
  ]);
  const recentOrders = orders.slice(0, 5);
  const inventory = products.slice(0, 5);

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const expiryMs = tokenExpiryMs(token);
  const sessionLabel = expiryMs
    ? `会话至 ${fmtExpiry(expiryMs)}`
    : "无活动会话";

  const stats = [
    { href: "/admin/products", num: c.products, label: "商品" },
    { href: "/admin/cards", num: c.cards, label: "未售卡密" },
    { href: "/admin/orders", num: c.orders, label: "订单总数" },
    { href: "/admin/orders", num: c.paid, label: "已支付" },
    { href: "/admin/posts", num: c.posts, label: "博客" },
    { href: "/admin/projects", num: c.projects, label: "项目" },
  ];

  return (
    <>
      <div className="admin-head">
        <h1>仪表盘</h1>
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
            <h2>最近订单</h2>
            <Link href="/admin/orders">全部 →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="admin-empty" style={{ border: "none", margin: 0 }}>
              还没有订单。
            </div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">订单号</th>
                    <th scope="col">商品</th>
                    <th scope="col">金额</th>
                    <th scope="col">状态</th>
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
                          {o.status === "paid" ? "已支付" : "待支付"}
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
              <h2>快捷操作</h2>
            </div>
            <div className="dash-quick">
              <Link href="/admin/products/new">
                <span className="dash-quick__k">new</span>新建商品
              </Link>
              <Link href="/admin/posts/new">
                <span className="dash-quick__k">post</span>写文章
              </Link>
              <Link href="/admin/cards">
                <span className="dash-quick__k">card</span>导入卡密
              </Link>
              <Link href="/admin/projects/new">
                <span className="dash-quick__k">proj</span>新建项目
              </Link>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel__head">
              <h2>库存关注</h2>
              <Link href="/admin/cards">卡密池 →</Link>
            </div>
            {inventory.length === 0 ? (
              <div className="admin-empty" style={{ border: "none", margin: 0 }}>
                还没有商品。
              </div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">商品</th>
                      <th scope="col">模式</th>
                      <th scope="col">余量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          <span className="admin-pill">
                            {p.deliveryMode === "card" ? "卡密" : "固定"}
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
