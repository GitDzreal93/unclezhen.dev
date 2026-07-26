import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildPaymentForm } from "@/lib/zpay";

// Create a pending order for a single virtual product and return the signed
// z-pay page-jump form. Stock is checked and the amount recomputed server-side
// so neither can be tampered client-side.
export async function POST(req: Request) {
  try {
    const { productId, email, qty, payType } = await req.json();
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    if (!productId || !email) {
      return NextResponse.json({ error: "缺少商品或邮箱" }, { status: 400 });
    }

    // Load product with live stock (card mode uses unused-card count).
    const rows = await query<{
      id: string;
      name: string;
      price: number;
      delivery_mode: string;
      stock: number;
    }>(
      `SELECT p.id, p.name, p.price, p.delivery_mode,
              CASE WHEN p.delivery_mode='card'
                   THEN COALESCE(c.unused,0) ELSE p.stock END AS stock
         FROM products p
         LEFT JOIN (SELECT product_id, COUNT(*)::int unused FROM cards WHERE status='unused' GROUP BY product_id) c
           ON c.product_id = p.id
        WHERE p.id = $1`,
      [String(productId)]
    );
    const product = rows[0];
    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    // stock < 0 means unlimited (fixed mode only).
    if (product.stock >= 0 && product.stock < q) {
      return NextResponse.json({ error: "库存不足" }, { status: 409 });
    }

    const amount = product.price * q;
    const outTradeNo = `U${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
    const type = payType === "wxpay" ? "wxpay" : "alipay";

    await query(
      `INSERT INTO orders (out_trade_no, email, product_id, product_name, qty, amount, status, pay_type)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)`,
      [outTradeNo, String(email), product.id, product.name, q, amount, type]
    );

    const base = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
    const { action, fields } = buildPaymentForm({
      outTradeNo,
      name: product.name,
      money: amount.toFixed(2),
      type,
      notifyUrl: `${base}/api/pay/notify`,
      returnUrl: `${base}/orders/${outTradeNo}`,
    });

    return NextResponse.json({ ok: true, outTradeNo, action, fields });
  } catch (e) {
    console.error("order error", e);
    const msg = e instanceof Error ? e.message : "内部错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
