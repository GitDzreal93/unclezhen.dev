"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { deleteProduct } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export default function ProductsTable({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部分类");
  const [mode, setMode] = useState("全部发货");

  const cats = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.cat && s.add(p.cat));
    return ["全部分类", ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products.filter((p) => {
      const qOk = !qq || (p.id + " " + p.name).toLowerCase().includes(qq);
      const catOk = cat === "全部分类" || p.cat === cat;
      const modeLabel = p.deliveryMode === "card" ? "卡密" : "固定";
      const modeOk = mode === "全部发货" || modeLabel === mode;
      return qOk && catOk && modeOk;
    });
  }, [products, q, cat, mode]);

  return (
    <>
      <div className="toolbar">
        <div className="field grow">
          <label className="sr-only" htmlFor="q">搜索</label>
          <input
            id="q"
            type="search"
            placeholder="搜索 ID / 名称…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 120 }}>
          <label className="sr-only" htmlFor="f-cat">分类</label>
          <select id="f-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 120 }}>
          <label className="sr-only" htmlFor="f-mode">发货</label>
          <select id="f-mode" className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>全部发货</option>
            <option>固定</option>
            <option>卡密</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">没有匹配的商品</div>
          <p className="admin-empty__desc">调整搜索或筛选条件，或新建一个商品。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/products/new">
            + 新建商品
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">名称</th>
                <th scope="col">分类</th>
                <th scope="col">价格</th>
                <th scope="col">发货</th>
                <th scope="col">库存</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
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
                      <Link className="btn btn--ghost btn--sm" href={`/admin/products/${p.id}`}>
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
        </div>
      )}
    </>
  );
}
