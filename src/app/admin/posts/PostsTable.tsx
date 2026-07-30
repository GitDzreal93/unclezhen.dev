"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/data";
import { deletePost } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export default function PostsTable({ posts }: { posts: Post[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("全部标签");

  const tags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => t && s.add(t)));
    return ["全部标签", ...Array.from(s).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return posts.filter((p) => {
      const qOk =
        !qq ||
        (p.id + " " + p.title + " " + p.excerpt).toLowerCase().includes(qq);
      const tagOk = tag === "全部标签" || p.tags.includes(tag);
      return qOk && tagOk;
    });
  }, [posts, q, tag]);

  return (
    <>
      <div className="toolbar">
        <div className="field grow">
          <label className="sr-only" htmlFor="q">搜索</label>
          <input
            id="q"
            type="search"
            placeholder="搜索 ID / 标题 / 摘要…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="sr-only" htmlFor="f-tag">标签</label>
          <select id="f-tag" className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-count">
          {filtered.length}/{posts.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">没有匹配的文章</div>
          <p className="admin-empty__desc">调整搜索或标签筛选，或新建一篇文章。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/posts/new">
            + 新建文章
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">标题</th>
                <th scope="col">日期</th>
                <th scope="col">标签</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.id}</td>
                  <td>{p.title}</td>
                  <td className="mono">{p.date}</td>
                  <td>{p.tags.join(" · ")}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="btn btn--ghost btn--sm" href={`/admin/posts/${p.id}`}>
                        编辑
                      </Link>
                      <DeleteButton
                        id={p.id}
                        action={deletePost}
                        confirm={`删除文章「${p.title}」？`}
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
