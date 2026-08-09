"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Issue } from "@/lib/data";
import { saveIssue } from "@/lib/admin";

export default function IssueForm({
  issue,
  isNew,
}: {
  issue?: Issue;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [id, setId] = useState(issue?.id ?? "");
  const [issueNo, setIssueNo] = useState(String(issue?.issueNo ?? 1));
  const [title, setTitle] = useState(issue?.title ?? "");
  const [coverImage, setCoverImage] = useState(issue?.coverImage ?? "");
  const [weather, setWeather] = useState(issue?.weather ?? "");
  const [publishedAt, setPublishedAt] = useState(issue?.publishedAt ?? todayISO());
  const [visible, setVisible] = useState(Boolean(issue?.visible));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("id", id.trim());
    fd.set("issueNo", issueNo);
    fd.set("title", title);
    fd.set("coverImage", coverImage);
    fd.set("weather", weather);
    fd.set("publishedAt", publishedAt);
    fd.set("visible", visible ? "true" : "false");
    startTransition(async () => {
      try {
        await saveIssue(fd);
        router.push(`/admin/issues/${id.trim()}`);
        router.refresh();
      } catch (e) {
        setError(String((e as Error).message || e));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="admin-form admin-form--panel">
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="row2">
        <div className="field">
          <label>期刊 ID</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            readOnly={!isNew}
            required
            placeholder="issue-001"
          />
          <span className="field-hint">URL 路径用，例 /weekly/{id || "issue-001"}</span>
        </div>
        <div className="field">
          <label>期号</label>
          <input
            type="number"
            min={1}
            value={issueNo}
            onChange={(e) => setIssueNo(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label>标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="赛博晚报 · 第 1 期"
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>发布日期</label>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>状态</label>
          <label className="field-check" style={{ paddingTop: 8 }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            <span>对外发布（取消勾选 = 草稿）</span>
          </label>
        </div>
      </div>

      <div className="field">
        <label>天气 / 卷首语</label>
        <input
          type="text"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          placeholder="晴 · 西南风 3 级 · 编辑寄语…"
        />
      </div>

      <div className="field">
        <label>封面图 URL（可选）</label>
        <input
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="/assets/weekly/issue-001-cover.png"
        />
      </div>

      <div className="admin-form__actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={pending}>
          {pending ? "保存中…" : isNew ? "创建期刊" : "保存"}
        </button>
      </div>
    </form>
  );
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
