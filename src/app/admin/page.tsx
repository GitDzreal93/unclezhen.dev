import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function counts() {
  const [posts, projects, products, orders, pending, cards] = await Promise.all([
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
    paid: +pending[0].n,
    cards: +cards[0].n,
  };
}

export default async function AdminDashboard() {
  const c = await counts();
  const stats = [
    { href: "/admin/products", num: c.products, label: "商品" },
    { href: "/admin/cards", num: c.cards, label: "未售卡密" },
    { href: "/admin/orders", num: c.orders, label: "订单总数" },
    { href: "/admin/orders", num: c.paid, label: "已支付订单" },
    { href: "/admin/posts", num: c.posts, label: "博客文章" },
    { href: "/admin/projects", num: c.projects, label: "项目" },
  ];
  return (
    <>
      <div className="admin-head">
        <h1>仪表盘</h1>
      </div>
      <div className="admin-stats">
        {stats.map((s, i) => (
          <Link key={i} className="admin-stat" href={s.href}>
            <div className="admin-stat__num">{s.num}</div>
            <div className="admin-stat__label">{s.label}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
