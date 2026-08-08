"use client";

import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminBanner } from "@/lib/data";
import { saveBanner } from "@/lib/admin";

export default function BannerForm({
  isNew,
  banner,
}: {
  isNew: boolean;
  banner?: AdminBanner;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState(banner?.id ?? "");
  const [title, setTitle] = useState(banner?.title ?? "");
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [sort, setSort] = useState(String(banner?.sort ?? 0));
  const [visible, setVisible] = useState(banner?.visible ?? true);
  const [uploading, setUploading] = useState(false);

  // Upload to the image host and fill imageUrl — same endpoint the post editor uses.
  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "上传失败");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", title);
    fd.set("imageUrl", imageUrl);
    fd.set("linkUrl", linkUrl);
    fd.set("sort", sort);
    fd.set("visible", String(visible));
    startTransition(async () => {
      try {
        await saveBanner(fd);
        router.push("/admin/banners");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  return (
    <form className="series-form" onSubmit={onSubmit}>
      <div className="post-editor__bar">
        <div className="post-editor__bar-title">{isNew ? "新建 Banner" : "编辑 Banner"}</div>
        <div className="post-editor__bar-actions">
          <Link className="btn btn--ghost btn--sm" href="/admin/banners">
            返回列表
          </Link>
          <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      <div className="post-editor__meta">
        <div className="field">
          <label htmlFor="id">Banner ID</label>
          <input
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            readOnly={!isNew}
            required
            placeholder="如 agent-promo"
          />
        </div>
        <div className="field">
          <label htmlFor="title">标题（alt 文案）</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="如 Agent 学习笔记"
          />
        </div>
        <div className="field">
          <label htmlFor="sort">排序</label>
          <input
            id="sort"
            type="number"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
        <div className="field field--excerpt">
          <label htmlFor="imageUrl">图片 URL（建议 280×160）</label>
          <input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            placeholder="https://cdn.jsdelivr.net/gh/..."
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            hidden
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{ marginTop: 8 }}
          >
            {uploading ? "上传中…" : "上传图片到图床"}
          </button>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="预览"
              style={{ marginTop: 8, maxWidth: 280, borderRadius: 6, border: "1px solid var(--border)" }}
            />
          )}
        </div>
        <div className="field field--excerpt">
          <label htmlFor="linkUrl">跳转链接（合集 /blog/series/… 或任意 URL）</label>
          <input
            id="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/blog/series/agent-notes 或 https://…"
          />
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />{" "}
            显示（取消则不在侧栏轮播）
          </label>
        </div>
      </div>

      {error && (
        <p className="admin-login__err" style={{ padding: "8px 16px" }}>
          {error}
        </p>
      )}
    </form>
  );
}
