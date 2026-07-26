import Link from "next/link";
import ProductForm from "../ProductForm";

export default function NewProduct() {
  return (
    <>
      <div className="admin-head">
        <h1>新建商品</h1>
        <div className="admin-head__meta">
          <Link className="btn btn--ghost btn--sm" href="/admin/products">
            返回列表
          </Link>
        </div>
      </div>
      <ProductForm isNew />
    </>
  );
}
