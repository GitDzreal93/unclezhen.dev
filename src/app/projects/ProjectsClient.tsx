"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/data";

export default function ProjectsClient({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState("全部");
  const [openId, setOpenId] = useState<string | null>(null);

  const types = useMemo(() => {
    const s = new Set<string>(["全部"]);
    projects.forEach((p) => s.add(p.type));
    return Array.from(s);
  }, [projects]);

  const list = useMemo(
    () => projects.filter((p) => active === "全部" || p.type === active),
    [projects, active]
  );

  const detail = openId ? projects.find((p) => p.id === openId) : null;

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">Projects</div>
        <h1>项目展示</h1>
        <p className="lead">交付案例与实验场。点卡片查看问题、方案与技术栈。</p>
        <div className="toolbar">
          <div className="filters">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-btn${t === active ? " is-active" : ""}`}
                onClick={() => setActive(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="grid-3">
          {list.map((p) => (
            <article key={p.id} className="card proj-card">
              <div className="thumb" data-label={p.type}>
                <div className="thumb-grid"></div>
                <div className="thumb-shape"></div>
              </div>
              <div className="card__body">
                <div className="card__meta">
                  <span className="mono">{p.year}</span>
                  <span className="tag">{p.type}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="muted" style={{ fontSize: 14 }}>{p.blurb}</p>
                <div className="stack">
                  {p.stack.map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ justifySelf: "start", marginTop: 4 }}
                  onClick={() => setOpenId(p.id)}
                >
                  查看详情
                </button>
              </div>
            </article>
          ))}
        </div>

        {detail && (
          <div className="detail-panel is-open" aria-live="polite">
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              onClick={() => setOpenId(null)}
            >
              收起详情
            </button>
            <div className="detail-grid">
              <div>
                <div className="card__meta">
                  <span className="mono">{detail.year}</span>
                  <span className="tag">{detail.type}</span>
                </div>
                <h2>{detail.name}</h2>
                <p>问题：{detail.problem} 方案：{detail.solution}</p>
                <p style={{ marginTop: 12 }}>结果：{detail.result}</p>
              </div>
              <dl className="kv">
                <div><dt>角色</dt><dd>{detail.role}</dd></div>
                <div><dt>技术栈</dt><dd>{detail.stack.join(" · ")}</dd></div>
                <div><dt>类型</dt><dd>{detail.type}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
