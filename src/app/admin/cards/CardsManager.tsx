"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/data";
import { addCards, deleteCard } from "@/lib/admin";

export default function CardsManager({
  products,
  selected,
  cards,
}: {
  products: { id: string; name: string }[];
  selected: string;
  cards: Card[];
}) {
  const router = useRouter();
  const [bulk, setBulk] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function switchProduct(id: string) {
    router.push(`/admin/cards?p=${encodeURIComponent(id)}`);
  }

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("productId", selected);
    fd.set("cards", bulk);
    startTransition(async () => {
      try {
        await addCards(fd);
        setBulk("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "导入失败");
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("删除这条未售卡密？")) return;
    startTransition(async () => {
      try {
        await deleteCard(id);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "删除卡密失败";
        setError(msg);
      }
    });
  }

  // Live preview of the bulk import: total non-empty lines, dupes against the
  // existing unused cards for this product, and in-paste dupes.
  const preview = useMemo(() => {
    const lines = bulk
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const inPasteDups = new Set<string>();
    let dup = 0;
    let empty = 0;
    const allLines = bulk.split("\n");
    for (const raw of allLines) {
      const t = raw.trim();
      if (!t) {
        empty++;
        continue;
      }
      if (seen.has(t)) {
        inPasteDups.add(t);
        dup++;
      } else {
        seen.add(t);
      }
    }
    const existingUnused = new Set(
      cards.filter((c) => c.status === "unused").map((c) => c.content)
    );
    const existingDups = lines.filter((l) => existingUnused.has(l)).length;
    const willInsert = Math.max(0, lines.length - dup - existingDups);
    return { total: lines.length, empty, dup, existingDups, willInsert };
  }, [bulk, cards]);

  return (
    <>
      <form className="toolbar" onSubmit={onAdd}>
        <div className="field" style={{ minWidth: 220 }}>
          <label htmlFor="card-prod">商品</label>
          <select
            id="card-prod"
            className="select"
            value={selected}
            onChange={(e) => switchProduct(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ alignSelf: "end", marginLeft: "auto" }}>
          <label className="sr-only" htmlFor="import-btn">导入</label>
          <button
            id="import-btn"
            className="btn btn--primary btn--sm"
            type="submit"
            disabled={pending || preview.total === 0 || preview.willInsert === 0}
          >
            {pending ? "导入中…" : `导入卡密${preview.willInsert > 0 ? `（${preview.willInsert}）` : ""}`}
          </button>
        </div>
      </form>

      <div className="md-import" style={{ marginBottom: 10 }}>
        <label htmlFor="bulk">批量导入（每行一条卡密 / 链接）</label>
        <textarea
          id="bulk"
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={"CARD-AAAA-1111\nCARD-BBBB-2222\nhttps://pan.example.com/x 提取码 abcd"}
        />
        {bulk.trim() && (
          <p className="hint" style={{ marginTop: 4 }}>
            共 <strong>{preview.total}</strong> 条
            {preview.empty > 0 && (
              <>
                · 空行 <strong>{preview.empty}</strong>
              </>
            )}
            {preview.dup > 0 && (
              <>
                · 粘贴内重复 <strong>{preview.dup}</strong>
              </>
            )}
            {preview.existingDups > 0 && (
              <>
                · 与已存在未售重复 <strong style={{ color: "var(--warn)" }}>
                  {preview.existingDups}
                </strong>
              </>
            )}
            {" · "}将新增 <strong style={{ color: "var(--accent)" }}>{preview.willInsert}</strong> 条
          </p>
        )}
        {error && <p className="admin-login__err">{error}</p>}
      </div>

      {cards.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">这个商品还没有卡密</div>
          <p className="admin-empty__desc">在上方粘贴区录入后点「导入卡密」。</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">内容</th>
                <th scope="col">状态</th>
                <th scope="col">订单</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td className="mono">{c.content}</td>
                  <td>
                    <span className={`admin-pill${c.status === "unused" ? " admin-pill--ok" : ""}`}>
                      {c.status === "unused" ? "未售" : "已售"}
                    </span>
                  </td>
                  <td className="mono">{c.orderId ?? "—"}</td>
                  <td>
                    {c.status === "unused" && (
                      <button className="admin-danger" type="button" onClick={() => remove(c.id)} disabled={pending}>
                        删除
                      </button>
                    )}
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
