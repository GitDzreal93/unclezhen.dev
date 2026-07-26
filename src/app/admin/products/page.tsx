import Link from "next/link";
import { getProducts } from "@/lib/data";
import { deleteProduct } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getProducts();
  return (
    <>
      <div className="admin-head">
        <h1>商品</h1>
        <Link className="btn btn--primary btn--sm" href="/admin/products/new">
          + 新建商品
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="admin-empty">还没有商品，点右上角新建。</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>分类</th>
              <th>价格</th>
              <th>发货</th>
              <th>库存</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.id}</td>
                <td>{p.name}</td>
                <td>{p.cat}</td>
                <td className="mono">¥{p.price}</td>
                <td>
                  <span className="admin-pill">
                    {p.deliveryMode === "card" ? "卡密" : "固定"}
                  </span>
                </td>
                <td className="mono">{p.stock < 0 ? "∞" : p.stock}</td>
                <td>
                  <div className="admin-actions">
                    <Link
                      className="btn btn--ghost btn--sm"
                      href={`/admin/products/${p.id}`}
                    >
                      编辑
                    </Link>
                    <DeleteButton
                      id={p.id}
                      action={deleteProduct}
                      confirm={`删除商品「${p.name}」？未售卡密会一并删除。`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
