"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/data";
import Modal from "@/components/Modal";
import { toast } from "@/components/toast";

export default function CoursesClient({ courses }: { courses: Course[] }) {
  const [active, setActive] = useState("全部");
  const [enrollId, setEnrollId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tags = useMemo(() => {
    const s = new Set<string>(["全部"]);
    courses.forEach((c) => s.add(c.tag));
    return Array.from(s);
  }, [courses]);

  const list = useMemo(
    () => courses.filter((c) => active === "全部" || c.tag === active),
    [courses, active]
  );

  const enrolling = enrollId ? courses.find((c) => c.id === enrollId) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enrolling) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: enrolling.id,
          course: enrolling.title,
          name: data.get("name"),
          contact: data.get("contact"),
          note: data.get("note"),
        }),
      });
      setEnrollId(null);
      toast("意向已记录");
      form.reset();
    } catch {
      toast("提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="page-hero wrap">
        <div className="eyebrow">Courses</div>
        <h1>课程</h1>
        <p className="lead">
          面向开发者与想转产品交付的工程师。先看大纲与适合谁，再决定是否报名。
        </p>
        <div className="toolbar">
          <div className="filters">
            {tags.map((t) => (
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

      <div className="wrap" id="catalog" style={{ paddingBottom: 72 }}>
        <div className="grid-3">
          {list.map((c) => (
            <article key={c.id} className="card course-card">
              <div className="top">
                <div className="row-between">
                  <span className="tag tag--accent">{c.tag}</span>
                  <span className="level">{c.level} · {c.hours}</span>
                </div>
                <h3>{c.title}</h3>
                <p>{c.audience}</p>
              </div>
              <div className="body">
                <p>
                  <strong style={{ color: "var(--fg)", fontWeight: 550 }}>学完能交付：</strong>
                  {c.outcome}
                </p>
                <ul className="outline">
                  {c.outline.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <div className="row-between">
                  <div className="price">¥{c.price} <small>起</small></div>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setEnrollId(c.id)}
                  >
                    报名意向
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Modal open={!!enrolling} onClose={() => setEnrollId(null)} labelledBy="enroll-title">
        <h3 id="enroll-title">报名意向</h3>
        <p>
          {enrolling
            ? `课程：「${enrolling.title}」· 标价 ¥${enrolling.price}（演示，不扣款）`
            : "提交后仅作原型演示，不会扣款。"}
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="e-name">称呼</label>
            <input id="e-name" name="name" required placeholder="怎么叫你" />
          </div>
          <div className="field">
            <label htmlFor="e-contact">邮箱 / 微信</label>
            <input id="e-contact" name="contact" required placeholder="方便联系的方式" />
          </div>
          <div className="field">
            <label htmlFor="e-note">你的基础（可选）</label>
            <textarea id="e-note" name="note" placeholder="例如：写过 React，没碰过 WebGL"></textarea>
          </div>
          <div className="modal__actions">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setEnrollId(null)}>
              取消
            </button>
            <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
              提交意向
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
