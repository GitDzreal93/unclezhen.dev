import { NextResponse } from "next/server";
import { getOrderByOutTradeNo } from "@/lib/data";

// Public order status lookup for the return page poller. Returns only the
// fields needed to show payment status and delivered content.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ out_trade_no: string }> }
) {
  try {
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
  } catch (e) {
    console.error("order status error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "内部错误" },
      { status: 500 }
    );
  }
}
