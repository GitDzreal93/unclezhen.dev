import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data";
import { query } from "@/lib/db";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  // For card-mode products, show the live unused-card count next to the hint
  // so the admin sees current inventory without bouncing to the cards page.
  const unusedCount = product.deliveryMode === "card"
    ? +(await query<{ n: string }>(
        "SELECT COUNT(*) n FROM cards WHERE product_id=$1 AND status='unused'",
        [id]
      ))[0].n
    : null;
  return (
    <>
      <div className="admin-head">
        <h1>编辑商品</h1>
        <div className="admin-head__meta">
          <span className="mono">{product.id}</span>
          <Link className="btn btn--ghost btn--sm" href="/admin/products">
            返回列表
          </Link>
        </div>
      </div>
      <ProductForm product={product} isNew={false} unusedCardCount={unusedCount} />
    </>
  );
}
