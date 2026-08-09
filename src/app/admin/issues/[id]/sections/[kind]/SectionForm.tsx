"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveIssueSection } from "@/lib/admin";
import { defaultSectionBody, type SectionKind } from "@/lib/issues-types";
import MastheadForm from "./forms/MastheadForm";
import LeadForm from "./forms/LeadForm";
import ColophonForm from "./forms/ColophonForm";

// Dispatcher: each kind has its own form component. v1 implements
// masthead, lead, colophon. Other kinds (briefs, wire, ads, trending,
// supplement, dateline) show a placeholder and post an unchanged body —
// the form for them ships in v2.
export default function SectionForm({
  issueId,
  sectionId,
  kind,
  initialBody,
  initialLabel,
  initialVisible,
}: {
  issueId: string;
  sectionId: string;
  kind: SectionKind;
  initialBody: unknown;
  initialLabel: string;
  initialVisible: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function renderKindForm() {
    switch (kind) {
      case "masthead":
        return <MastheadForm initial={initialBody as any} />;
      case "lead":
        return <LeadForm initial={initialBody as any} />;
      case "colophon":
        return <ColophonForm initial={initialBody as any} />;
      default:
        return (
          <div className="admin-empty">
            <div className="admin-empty__title">{kind} · v2 即将支持</div>
            <p className="admin-empty__desc">
              该板块类型的表单编辑器还在开发中。先用占位 body 保存，等编辑器上线再补内容。
            </p>
          </div>
        );
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Body is sourced from the form's hidden `body` input (each form component
    // serializes its own state on change).
    fd.set("id", sectionId);
    if (!fd.has("visible")) fd.set("visible", "false");
    startTransition(async () => {
      try {
        await saveIssueSection(fd);
        router.push(`/admin/issues/${issueId}/sections`);
        router.refresh();
      } catch (err) {
        setError(String((err as Error).message || err));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="admin-form admin-form--panel">
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="row2">
        <div className="field">
          <label>板块标签（可选）</label>
          <input
            type="text"
            name="label"
            defaultValue={initialLabel}
            placeholder="默认按 kind 取名"
          />
        </div>
        <div className="field">
          <label>显示</label>
          <label className="field-check" style={{ paddingTop: 8 }}>
            <input
              type="checkbox"
              name="visible"
              value="true"
              defaultChecked={initialVisible}
            />
            <span>对外可见（取消勾选 = 在公开页隐藏）</span>
          </label>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "16px 0" }} />

      {renderKindForm()}

      <div className="admin-form__actions" style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn--primary btn--sm" disabled={pending}>
          {pending ? "保存中…" : "保存板块"}
        </button>
      </div>
    </form>
  );
}
