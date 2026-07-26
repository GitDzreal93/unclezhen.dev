import Link from "next/link";
import { getProducts } from "@/lib/data";
import ProductsTable from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getProducts();
  return (
    <>
      <div className="admin-head">
        <h1>商品</h1>
        <div className="admin-head__meta">
          <span className="toolbar-count" style={{ margin: 0 }}>
            {products.length} 件
          </span>
          <Link className="btn btn--primary btn--sm" href="/admin/products/new">
            + 新建
          </Link>
        </div>
      </div>
      <ProductsTable products={products} />
    </>
  );
}
