import { NextResponse } from "next/server";
import { getOrderByOutTradeNo } from "@/lib/data";

// Public order status lookup for the return page poller. Returns only the
// fields needed to show payment status and delivered content.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ out_trade_no: string }> }
) {
  const { out_trade_no } = await params;
  const order = await getOrderByOutTradeNo(out_trade_no);
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    outTradeNo: order.outTradeNo,
    status: order.status,
    deliveredContent: order.status === "paid" ? order.deliveredContent : "",
  });
}
