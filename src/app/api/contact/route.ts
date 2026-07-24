import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, contact, message } = await req.json();
    if (!name || !contact) {
      return NextResponse.json({ error: "name and contact required" }, { status: 400 });
    }
    await query(
      "INSERT INTO contacts (name, contact, message) VALUES ($1, $2, $3)",
      [String(name), String(contact), String(message ?? "")]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact error", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
