import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { courseId, course, name, contact, note } = await req.json();
    if (!course || !name || !contact) {
      return NextResponse.json({ error: "course, name and contact required" }, { status: 400 });
    }
    await query(
      "INSERT INTO enrollments (course_id, course, name, contact, note) VALUES ($1, $2, $3, $4, $5)",
      [courseId ? String(courseId) : null, String(course), String(name), String(contact), String(note ?? "")]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("enroll error", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
