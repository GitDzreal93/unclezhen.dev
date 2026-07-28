import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { uploadImage } from "@/lib/gh-image";
import { query } from "@/lib/db";

export const runtime = "nodejs";

// jsDelivr /gh caps a single file at 50 MB; keep a comfortable margin.
const MAX_BYTES = 8 * 1024 * 1024;

// Upload an image to the GitHub image-host repo and record its link in the
// images table. Multipart POST with fields: file (required), alt (optional).
export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "仅支持图片文件" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `图片过大（上限 ${MAX_BYTES / 1024 / 1024}MB）` },
      { status: 413 }
    );
  }

  let uploaded;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    uploaded = await uploadImage({
      filename: file.name,
      contentType: file.type,
      bytes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "上传失败" },
      { status: 502 }
    );
  }

  const alt = (fd.get("alt") as string) || "";
  await query(
    `INSERT INTO images (id,host,path,filename,bytes,content_type,alt)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      uploaded.id,
      uploaded.host,
      uploaded.path,
      uploaded.filename,
      uploaded.bytes,
      uploaded.contentType,
      alt,
    ]
  );

  return NextResponse.json({
    id: uploaded.id,
    url: uploaded.url,
    filename: uploaded.filename,
    markdown: `![${alt || uploaded.filename}](${uploaded.url})`,
  });
}
