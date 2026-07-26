"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/data";
import { saveProduct } from "@/lib/admin";

export default function ProductForm({
  product,
  isNew,
}: {
  product?: Product;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"fixed" | "card">(
    product?.deliveryMode ?? "fixed"
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveProduct(fd);
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="row2">
        <div className="field">
          <label htmlFor="id">商品 ID</label>
          <input
            id="id"
            name="id"
            defaultValue={product?.id}
            readOnly={!isNew}
            required
            placeholder="如 tpl-personal"
          />
          {!isNew && <p className="hint">ID 不可修改</p>}
        </div>
        <div className="field">
          <label htmlFor="name">名称</label>
          <input id="name" name="name" defaultValue={product?.name} required />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="cat">分类</label>
          <input id="cat" name="cat" defaultValue={product?.cat} placeholder="模板 / 源码 / 资料" />
        </div>
        <div className="field">
          <label htmlFor="price">价格（元）</label>
          <input id="price" name="price" type="number" min={0} step={1} defaultValue={product?.price ?? 0} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="descr">描述</label>
        <textarea id="descr" name="descr" defaultValue={product?.descr} />
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="deliveryMode">发货方式</label>
          <select
            id="deliveryMode"
            name="deliveryMode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "fixed" | "card")}
          >
            <option value="fixed">固定内容（所有买家同一份）</option>
            <option value="card">卡密池（每单发一条唯一内容）</option>
          </select>
        </div>
        {mode === "fixed" && (
          <div className="field">
            <label htmlFor="stock">库存（-1 = 无限）</label>
            <input
              id="stock"
              name="stock"
              type="number"
              step={1}
              defaultValue={product?.stock ?? -1}
            />
          </div>
        )}
      </div>

      {mode === "fixed" ? (
        <div className="field">
          <label htmlFor="fixedContent">发货内容</label>
          <textarea
            id="fixedContent"
            name="fixedContent"
            defaultValue={product?.fixedContent}
            placeholder="如：下载链接 + 提取码"
          />
          <p className="hint">买家支付成功后自动展示这段内容。</p>
        </div>
      ) : (
        <div className="field">
          <p className="hint">
            卡密模式的库存 = 未售卡密数，请到「卡密池」批量导入卡密。
            {isNew && " 保存商品后再去添加。"}
          </p>
        </div>
      )}

      <div className="field">
        <label htmlFor="sort">排序（小的在前）</label>
        <input id="sort" name="sort" type="number" step={1} defaultValue={0} />
      </div>

      {error && <p className="admin-login__err">{error}</p>}

      <div className="admin-form__actions">
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => router.push("/admin/products")}
        >
          取消
        </button>
      </div>
    </form>
  );
}