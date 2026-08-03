"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

export default function ProjectsClient({ projects, locale }: { projects: Project[]; locale: Locale }) {
  const allFilter = t(locale, "projects.allFilter");
  const [active, setActive] = useState(allFilter);
  const [openId, setOpenId] = useState<string | null>(null);

  const types = useMemo(() => {
    const s = new Set<string>([allFilter]);
    projects.forEach((p) => s.add(p.type));
    return Array.from(s);
  }, [projects, allFilter]);

  const list = useMemo(
    () => projects.filter((p) => active === allFilter || p.type === active),
    [projects, active, allFilter]
  );

  const detail = openId ? projects.find((p) => p.id === openId) : null;

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">{t(locale, "projects.eyebrow")}</div>
        <h1>{t(locale, "projects.heading")}</h1>
        <p className="lead">{t(locale, "projects.lead")}</p>
        <div className="toolbar">
          <div className="filters">
            {types.map((type) => (
              <button
                key={type}
                type="button"
                className={`filter-btn${type === active ? " is-active" : ""}`}
                onClick={() => setActive(type)}
              >
                {type}
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
                  {t(locale, "projects.card.cta")}
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
              {t(locale, "projects.collapse")}
            </button>
            <div className="detail-grid">
              <div>
                <div className="card__meta">
                  <span className="mono">{detail.year}</span>
                  <span className="tag">{detail.type}</span>
                </div>
                <h2>{detail.name}</h2>
                <p>{t(locale, "projects.problem")}: {detail.problem} {t(locale, "projects.solution")}: {detail.solution}</p>
                <p style={{ marginTop: 12 }}>{t(locale, "projects.result")}: {detail.result}</p>
              </div>
              <dl className="kv">
                <div><dt>{t(locale, "projects.role")}</dt><dd>{detail.role}</dd></div>
                <div><dt>{t(locale, "projects.stack")}</dt><dd>{detail.stack.join(" · ")}</dd></div>
                <div><dt>{t(locale, "projects.type")}</dt><dd>{detail.type}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
