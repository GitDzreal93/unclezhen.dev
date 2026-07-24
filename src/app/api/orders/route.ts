import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type IncomingItem = { id: string; qty: number };

export async function POST(req: Request) {
  try {
    const { email, items } = await req.json();
    if (!email || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "email and items required" }, { status: 400 });
    }

    // Recompute total from DB prices so it can't be tampered client-side.
    const ids = (items as IncomingItem[]).map((i) => String(i.id));
    const rows = await query<{ id: string; name: string; price: number }>(
      "SELECT id, name, price FROM products WHERE id = ANY($1)",
      [ids]
    );
    const priceMap = new Map(rows.map((r) => [r.id, r]));

    let total = 0;
    const normalized = (items as IncomingItem[])
      .map((i) => {
        const p = priceMap.get(String(i.id));
        const qty = Math.max(1, Math.floor(Number(i.qty) || 0));
        if (!p) return null;
        total += p.price * qty;
        return { id: p.id, name: p.name, price: p.price, qty };
      })
      .filter(Boolean);

    if (normalized.length === 0) {
      return NextResponse.json({ error: "no valid items" }, { status: 400 });
    }

    const [order] = await query<{ id: number }>(
      "INSERT INTO orders (email, items, total) VALUES ($1, $2, $3) RETURNING id",
      [String(email), JSON.stringify(normalized), total]
    );

    return NextResponse.json({ ok: true, orderId: order.id, total });
  } catch (e) {
    console.error("order error", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
