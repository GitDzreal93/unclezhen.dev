import { query } from "./db";

export type Post = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  body: string; // Markdown 源文
};

export type Project = {
  id: string;
  name: string;
  type: string;
  year: string;
  blurb: string;
  problem: string;
  solution: string;
  result: string;
  stack: string[];
  role: string;
};

export type DeliveryMode = "fixed" | "card";

export type Product = {
  id: string;
  name: string;
  cat: string;
  price: number;
  descr: string;
  deliveryMode: DeliveryMode;
  fixedContent: string; // fixed 模式发货内容
  stock: number; // -1 = 无限；card 模式由未售卡密数覆盖
};

export type Card = {
  id: number;
  productId: string;
  content: string;
  status: "unused" | "sold";
  orderId: number | null;
  createdAt: string;
};

export type NavItem = {
  key: string;
  label: string;
  href: string;
  sort: number;
  visible: boolean;
};

export type Series = {
  id: string;
  title: string;
  description: string;
  showNumber: boolean;
  sort: number;
};

// A post as it appears inside a series listing (no body — the series page is
// an index, not a reader).
export type SeriesPost = {
  postId: string;
  position: number;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
};

export type SeriesWithPosts = Series & { posts: SeriesPost[] };
export type SeriesWithCount = Series & { postCount: number };

export type OrderStatus = "pending" | "paid";

export type Order = {
  id: number;
  outTradeNo: string;
  email: string;
  productId: string;
  productName: string;
  qty: number;
  amount: number;
  status: OrderStatus;
  tradeNo: string;
  payType: string;
  deliveredContent: string;
  createdAt: string;
  paidAt: string | null;
};

// Format a Date/string as YYYY-MM-DD in a stable way.
function fmtDate(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return String(d ?? "");
}

// ---- Posts ----

export async function getPosts(): Promise<Post[]> {
  const rows = await query<any>(
    "SELECT id,title,date,tags,excerpt,body FROM posts ORDER BY date DESC, sort ASC"
  );
  return rows.map((r) => ({ ...r, date: fmtDate(r.date) }));
}

export async function getPost(id: string): Promise<Post | null> {
  const rows = await query<any>(
    "SELECT id,title,date,tags,excerpt,body FROM posts WHERE id=$1",
    [id]
  );
  if (rows.length === 0) return null;
  return { ...rows[0], date: fmtDate(rows[0].date) };
}

// ---- Projects ----

export async function getProjects(): Promise<Project[]> {
  return query<Project>(
    "SELECT id,name,type,year,blurb,problem,solution,result,stack,role FROM projects ORDER BY sort ASC"
  );
}

export async function getProject(id: string): Promise<Project | null> {
  const rows = await query<Project>(
    "SELECT id,name,type,year,blurb,problem,solution,result,stack,role FROM projects WHERE id=$1",
    [id]
  );
  return rows[0] ?? null;
}

// ---- Products ----

// Map a raw products row (snake_case) to the Product type. For card-mode
// products, stock reflects the count of unused cards rather than the column.
function mapProduct(r: any): Product {
  return {
    id: r.id,
    name: r.name,
    cat: r.cat,
    price: r.price,
    descr: r.descr,
    deliveryMode: r.delivery_mode,
    fixedContent: r.fixed_content ?? "",
    stock: r.stock,
  };
}

export async function getProducts(): Promise<Product[]> {
  // For card-mode products, override stock with the live unused-card count so
  // the storefront and admin always see real availability.
  const rows = await query<any>(
    `SELECT p.id,p.name,p.cat,p.price,p.descr,p.delivery_mode,p.fixed_content,
            CASE WHEN p.delivery_mode = 'card'
                 THEN COALESCE(c.unused, 0)
                 ELSE p.stock END AS stock
       FROM products p
       LEFT JOIN (
         SELECT product_id, COUNT(*)::int AS unused
           FROM cards WHERE status = 'unused' GROUP BY product_id
       ) c ON c.product_id = p.id
      ORDER BY p.sort ASC`
  );
  return rows.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const rows = await query<any>(
    `SELECT p.id,p.name,p.cat,p.price,p.descr,p.delivery_mode,p.fixed_content,
            CASE WHEN p.delivery_mode = 'card'
                 THEN COALESCE(c.unused, 0)
                 ELSE p.stock END AS stock
       FROM products p
       LEFT JOIN (
         SELECT product_id, COUNT(*)::int AS unused
           FROM cards WHERE status = 'unused' GROUP BY product_id
       ) c ON c.product_id = p.id
      WHERE p.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapProduct(rows[0]);
}

// ---- Cards ----

export async function getCards(productId: string): Promise<Card[]> {
  const rows = await query<any>(
    "SELECT id,product_id,content,status,order_id,created_at FROM cards WHERE product_id=$1 ORDER BY id DESC",
    [productId]
  );
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    content: r.content,
    status: r.status,
    orderId: r.order_id,
    createdAt: fmtDate(r.created_at),
  }));
}

// ---- Orders ----

function mapOrder(r: any): Order {
  return {
    id: r.id,
    outTradeNo: r.out_trade_no,
    email: r.email,
    productId: r.product_id,
    productName: r.product_name,
    qty: r.qty,
    amount: r.amount,
    status: r.status,
    tradeNo: r.trade_no ?? "",
    payType: r.pay_type ?? "",
    deliveredContent: r.delivered_content ?? "",
    createdAt: String(r.created_at ?? ""),
    paidAt: r.paid_at ? String(r.paid_at) : null,
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await query<any>(
    `SELECT id,out_trade_no,email,product_id,product_name,qty,amount,status,
            trade_no,pay_type,delivered_content,created_at,paid_at
       FROM orders ORDER BY id DESC`
  );
  return rows.map(mapOrder);
}

export async function getOrderByOutTradeNo(
  outTradeNo: string
): Promise<Order | null> {
  const rows = await query<any>(
    `SELECT id,out_trade_no,email,product_id,product_name,qty,amount,status,
            trade_no,pay_type,delivered_content,created_at,paid_at
       FROM orders WHERE out_trade_no=$1`,
    [outTradeNo]
  );
  return rows.length ? mapOrder(rows[0]) : null;
}

// ---- Nav ----

// Snake→camel remap kept explicit for symmetry with mapProduct, even though
// the column names already happen to match the type.
function mapNavItem(r: any): NavItem {
  return {
    key: r.key,
    label: r.label,
    href: r.href,
    sort: r.sort,
    visible: Boolean(r.visible),
  };
}

// Admin uses this — no visibility filter, returns all rows so the toggle UI
// can show and edit every entry regardless of state.
export async function getNavItems(): Promise<NavItem[]> {
  const rows = await query<any>(
    "SELECT key,label,href,sort,visible FROM nav_items ORDER BY sort ASC"
  );
  return rows.map(mapNavItem);
}

// Public consumers (SiteNav, LauncherStage, GameClient, home module grid)
// use this — filtered to visible=true so a single UPDATE in the admin
// reflects everywhere at once.
export async function getVisibleNavItems(): Promise<NavItem[]> {
  const rows = await query<any>(
    "SELECT key,label,href,sort,visible FROM nav_items WHERE visible = true ORDER BY sort ASC"
  );
  return rows.map(mapNavItem);
}

// Single-key visibility check. Used by the data-driven page routes (/blog,
// /projects, /shop) so a hidden item returns 404 on direct URL access. The
// "home" and "game" keys are never toggled off, but the check still works
// if the DB is ever edited by hand.
export async function isNavItemVisible(key: string): Promise<boolean> {
  const rows = await query<{ visible: boolean }>(
    "SELECT visible FROM nav_items WHERE key=$1",
    [key]
  );
  return rows.length > 0 && Boolean(rows[0].visible);
}

// ---- Images ----
// The binary lives in a GitHub repo (served via CDN); the DB only stores the
// link. host + path are kept split so the CDN origin can be swapped later.

export type Image = {
  id: string;
  host: string;
  path: string;
  filename: string;
  bytes: number;
  contentType: string;
  alt: string;
  createdAt: string;
};

export async function getImages(): Promise<Image[]> {
  const rows = await query<any>(
    "SELECT id,host,path,filename,bytes,content_type,alt,created_at FROM images ORDER BY created_at DESC"
  );
  return rows.map((r) => ({
    id: r.id,
    host: r.host,
    path: r.path,
    filename: r.filename,
    bytes: r.bytes,
    contentType: r.content_type,
    alt: r.alt,
    createdAt: String(r.created_at ?? ""),
  }));
}

// ---- Series ----

function mapSeries(r: any): Series {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    showNumber: Boolean(r.show_number),
    sort: r.sort,
  };
}

// All series with their post counts — for the admin table and the blog sidebar.
export async function getSeriesWithCounts(): Promise<SeriesWithCount[]> {
  const rows = await query<any>(
    `SELECT s.id,s.title,s.description,s.show_number,s.sort,
            COUNT(sp.post_id)::int AS post_count
       FROM series s
       LEFT JOIN series_posts sp ON sp.series_id = s.id
      GROUP BY s.id
      ORDER BY s.sort ASC, s.created_at ASC`
  );
  return rows.map((r) => ({ ...mapSeries(r), postCount: r.post_count }));
}

// Single series metadata — for the admin edit page.
export async function getSeries(id: string): Promise<Series | null> {
  const rows = await query<any>(
    "SELECT id,title,description,show_number,sort FROM series WHERE id=$1",
    [id]
  );
  return rows.length ? mapSeries(rows[0]) : null;
}

// A series with its posts ordered by position — for the public series page.
// Returns null for a nonexistent series so the page can 404.
export async function getSeriesWithPosts(id: string): Promise<SeriesWithPosts | null> {
  const srows = await query<any>(
    "SELECT id,title,description,show_number,sort FROM series WHERE id=$1",
    [id]
  );
  if (srows.length === 0) return null;
  const prows = await query<any>(
    `SELECT sp.post_id,sp.position,p.title,p.date,p.tags,p.excerpt
       FROM series_posts sp
       JOIN posts p ON p.id = sp.post_id
      WHERE sp.series_id = $1
      ORDER BY sp.position ASC`,
    [id]
  );
  return {
    ...mapSeries(srows[0]),
    posts: prows.map((r) => ({
      postId: r.post_id,
      position: r.position,
      title: r.title,
      date: fmtDate(r.date),
      tags: r.tags,
      excerpt: r.excerpt,
    })),
  };
}

// Which series a post belongs to (with each series' total post count) — for
// the "part of series" nav on a post page.
export async function getSeriesForPost(postId: string): Promise<SeriesWithCount[]> {
  const rows = await query<any>(
    `SELECT s.id,s.title,s.description,s.show_number,s.sort,
            COUNT(sp2.post_id)::int AS post_count
       FROM series s
       JOIN series_posts sp ON sp.series_id = s.id AND sp.post_id = $1
       LEFT JOIN series_posts sp2 ON sp2.series_id = s.id
      GROUP BY s.id
      ORDER BY s.sort ASC`,
    [postId]
  );
  return rows.map((r) => ({ ...mapSeries(r), postCount: r.post_count }));
}
