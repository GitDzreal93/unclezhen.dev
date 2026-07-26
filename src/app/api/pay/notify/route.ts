import { pool } from "@/lib/db";
import { verifySign } from "@/lib/zpay";

// z-pay async payment notification (GET). Must return the literal text
// "success" on acceptance or z-pay keeps retrying. Steps:
//  1. verify signature
//  2. match order + amount, require trade_status === TRADE_SUCCESS
//  3. idempotent: already-paid orders return success without re-delivering
//  4. in a transaction, allocate card(s) or fixed content, decrement stock,
//     mark the order paid and record the delivered content
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (params[k] = v));

  if (!verifySign(params)) {
    return new Response("sign error", { status: 400 });
  }
  if (params.trade_status !== "TRADE_SUCCESS") {
    // Not a success event; acknowledge so z-pay stops retrying.
    return new Response("success");
  }

  const outTradeNo = params.out_trade_no;
  const tradeNo = params.trade_no || "";
  const money = params.money || "";
  if (!outTradeNo) return new Response("missing out_trade_no", { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the order row to serialize concurrent callbacks for the same order.
    const orderRes = await client.query(
      `SELECT id, product_id, qty, amount, status
         FROM orders WHERE out_trade_no=$1 FOR UPDATE`,
      [outTradeNo]
    );
    const order = orderRes.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return new Response("order not found", { status: 404 });
    }

    // Idempotent: already delivered.
    if (order.status === "paid") {
      await client.query("COMMIT");
      return new Response("success");
    }

    // Amount must match what we recorded (yuan, 2 decimals).
    if (Number(money) !== Number(order.amount)) {
      await client.query("ROLLBACK");
      return new Response("amount mismatch", { status: 400 });
    }

    // Determine delivery.
    const prodRes = await client.query(
      `SELECT delivery_mode, fixed_content, stock FROM products WHERE id=$1 FOR UPDATE`,
      [order.product_id]
    );
    const product = prodRes.rows[0];
    let delivered = "";

    if (product?.delivery_mode === "card") {
      // Grab `qty` unused cards, skipping rows locked by concurrent txns.
      const cardsRes = await client.query(
        `SELECT id, content FROM cards
          WHERE product_id=$1 AND status='unused'
          ORDER BY id ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED`,
        [order.product_id, order.qty]
      );
      if (cardsRes.rows.length < order.qty) {
        // Not enough stock to fulfil — leave pending, refuse (no retry help).
        await client.query("ROLLBACK");
        return new Response("out of stock", { status: 409 });
      }
      const ids = cardsRes.rows.map((r) => r.id);
      await client.query(
        `UPDATE cards SET status='sold', order_id=$2 WHERE id = ANY($1)`,
        [ids, order.id]
      );
      delivered = cardsRes.rows.map((r) => r.content).join("\n");
    } else {
      // Fixed content. Decrement finite stock; -1 means unlimited.
      delivered = product?.fixed_content || "";
      if (product && product.stock >= 0) {
        if (product.stock < order.qty) {
          await client.query("ROLLBACK");
          return new Response("out of stock", { status: 409 });
        }
        await client.query(
          `UPDATE products SET stock = stock - $2 WHERE id=$1`,
          [order.product_id, order.qty]
        );
      }
    }

    await client.query(
      `UPDATE orders SET status='paid', trade_no=$2, delivered_content=$3, paid_at=now()
         WHERE id=$1`,
      [order.id, tradeNo, delivered]
    );

    await client.query("COMMIT");
    return new Response("success");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("notify error", e);
    return new Response("error", { status: 500 });
  } finally {
    client.release();
  }
}
