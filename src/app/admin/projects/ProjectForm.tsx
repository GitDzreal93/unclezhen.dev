"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/data";
import { saveProject } from "@/lib/admin";

export default function ProjectForm({
  project,
  isNew,
}: {
  project?: Project;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveProject(fd);
        router.push("/admin/projects");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  return (
    <form className="admin-form admin-form--panel" onSubmit={onSubmit}>
      <div className="form-section-label">基础</div>
      <div className="row4">
        <div className="field">
          <label htmlFor="id">项目 ID</label>
          <input id="id" name="id" defaultValue={project?.id} readOnly={!isNew} required />
          {!isNew && <p className="hint">创建后不可修改</p>}
        </div>
        <div className="field">
          <label htmlFor="name">名称</label>
          <input id="name" name="name" defaultValue={project?.name} required />
        </div>
        <div className="field">
          <label htmlFor="type">类型</label>
          <input id="type" name="type" defaultValue={project?.type} placeholder="产品 / 工具 / 开源 / 交付" />
        </div>
        <div className="field">
          <label htmlFor="year">年份</label>
          <input id="year" name="year" defaultValue={project?.year} />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="role">角色</label>
          <input id="role" name="role" defaultValue={project?.role} />
        </div>
        <div className="field">
          <label htmlFor="sort">排序</label>
          <input id="sort" name="sort" type="number" step={1} defaultValue={0} />
        </div>
      </div>

      <div className="form-section-label">叙述</div>
      <div className="field">
        <label htmlFor="blurb">简介</label>
        <textarea id="blurb" name="blurb" rows={2} defaultValue={project?.blurb} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="problem">问题</label>
          <textarea id="problem" name="problem" rows={2} defaultValue={project?.problem} />
        </div>
        <div className="field">
          <label htmlFor="solution">方案</label>
          <textarea id="solution" name="solution" rows={2} defaultValue={project?.solution} />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="result">成果</label>
          <textarea id="result" name="result" rows={2} defaultValue={project?.result} />
        </div>
        <div className="field">
          <label htmlFor="stack">技术栈（逗号或换行分隔）</label>
          <textarea id="stack" name="stack" rows={2} defaultValue={project?.stack?.join("\n")} />
        </div>
      </div>

      {error && <p className="admin-login__err">{error}</p>}

      <div className="admin-form__actions">
        <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => router.push("/admin/projects")}>
          取消
        </button>
      </div>
    </form>
  );
}
