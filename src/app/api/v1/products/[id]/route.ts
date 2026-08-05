import { itemDelete, itemGet, itemPatch } from "@/lib/content-route";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) { return itemGet(request, "products", (await params).id); }
export async function PATCH(request: Request, { params }: Context) { return itemPatch(request, "products", (await params).id); }
export async function DELETE(request: Request, { params }: Context) { return itemDelete(request, "products", (await params).id); }
