"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/data";
import { deleteProject } from "@/lib/admin";
import DeleteButton from "../DeleteButton";

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("全部类型");

  const types = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.type && s.add(p.type));
    return ["全部类型", ...Array.from(s).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return projects.filter((p) => {
      const qOk =
        !qq ||
        (p.id + " " + p.name + " " + p.blurb + " " + p.stack.join(" "))
          .toLowerCase()
          .includes(qq);
      const typeOk = type === "全部类型" || p.type === type;
      return qOk && typeOk;
    });
  }, [projects, q, type]);

  return (
    <>
      <div className="toolbar">
        <div className="field grow">
          <label className="sr-only" htmlFor="q">搜索</label>
          <input
            id="q"
            type="search"
            placeholder="搜索 ID / 名称 / 简介 / 技术栈…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="sr-only" htmlFor="f-type">类型</label>
          <select id="f-type" className="select" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-count">
          {filtered.length}/{projects.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">没有匹配的项目</div>
          <p className="admin-empty__desc">调整搜索或类型筛选，或新建一个项目。</p>
          <Link className="btn btn--primary btn--sm" href="/admin/projects/new">
            + 新建项目
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">名称</th>
                <th scope="col">类型</th>
                <th scope="col">年份</th>
                <th scope="col"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.type}</td>
                  <td className="mono">{p.year}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="btn btn--ghost btn--sm" href={`/admin/projects/${p.id}`}>
                        编辑
                      </Link>
                      <DeleteButton
                        id={p.id}
                        action={deleteProject}
                        confirm={`删除项目「${p.name}」？`}
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
