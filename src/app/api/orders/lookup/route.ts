import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Order recovery: requires BOTH the order number and the matching email so a
// leaked/guessed order number alone can't reveal delivered content.
export async function POST(req: Request) {
  let body: { outTradeNo?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch (e) {
    console.warn("order lookup: bad json", e);
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const outTradeNo = typeof body?.outTradeNo === "string" ? body.outTradeNo : "";
  const email = typeof body?.email === "string" ? body.email : "";
  if (!outTradeNo || !email) {
    return NextResponse.json({ error: "请填写订单号和邮箱" }, { status: 400 });
  }
  try {
    const rows = await query<any>(
      `SELECT out_trade_no, product_name, qty, amount, status, delivered_content
         FROM orders WHERE out_trade_no=$1 AND lower(email)=lower($2)`,
      [outTradeNo.trim(), email.trim()]
    );
    const o = rows[0];
    if (!o) {
      return NextResponse.json({ error: "未找到匹配的订单" }, { status: 404 });
    }
    return NextResponse.json({
      outTradeNo: o.out_trade_no,
      productName: o.product_name,
      qty: o.qty,
      amount: o.amount,
      status: o.status,
      deliveredContent: o.status === "paid" ? o.delivered_content : "",
    });
  } catch (e) {
    console.error("order lookup error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "内部错误" },
      { status: 500 }
    );
  }
}
