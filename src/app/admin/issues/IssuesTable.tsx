"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Issue } from "@/lib/data";
import { deleteIssue } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export default function IssuesTable({ issues }: { issues: Issue[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return issues;
    return issues.filter((it) =>
      (it.id + " " + it.title + " #" + it.issueNo).toLowerCase().includes(qq)
    );
  }, [issues, q]);

  return (
    <>
      <div className="toolbar">
        <div className="field grow">
          <label className="sr-only" htmlFor="q">搜索</label>
          <input
            id="q"
            type="search"
            placeholder="搜索 ID / 标题 / 期号…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="toolbar-count">
          {filtered.length}/{issues.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">没有匹配的期刊</div>
          <p className="admin-empty__desc">调整搜索词，或新建一期。</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">期号</th>
                <th scope="col">标题</th>
                <th scope="col">发布日期</th>
                <th scope="col">状态</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id}>
                  <td className="mono">{it.id}</td>
                  <td className="mono">#{it.issueNo}</td>
                  <td>{it.title}</td>
                  <td className="mono">{it.publishedAt}</td>
                  <td>
                    {it.visible ? (
                      <span className="admin-pill admin-pill--ok">已发布</span>
                    ) : (
                      <span className="admin-pill admin-pill--warn">草稿</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link className="btn btn--ghost btn--sm" href={`/admin/issues/${it.id}`}>
                        编辑
                      </Link>
                      <DeleteButton
                        id={it.id}
                        action={deleteIssue}
                        confirm={`删除期刊「${it.title}」？所有板块会被一起删除。`}
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
