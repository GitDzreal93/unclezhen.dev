import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data";
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
  return (
    <>
      <div className="admin-head">
        <h1>编辑商品</h1>
      </div>
      <ProductForm product={product} isNew={false} />
    </>
  );
}
