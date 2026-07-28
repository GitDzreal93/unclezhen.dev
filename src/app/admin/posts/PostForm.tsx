"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/data";
import { savePost, previewMarkdown, htmlToMarkdown } from "@/lib/admin";

type ViewMode = "split" | "write" | "preview";

export default function PostForm({
  post,
  isNew,
}: {
  post?: Post;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [id, setId] = useState(post?.id ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [date, setDate] = useState(post?.date ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [sort, setSort] = useState("0");
  const [body, setBody] = useState(post?.body ?? "");

  const [preview, setPreview] = useState("");
  const [view, setView] = useState<ViewMode>("split");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const importRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Debounced live preview: render Markdown → sanitized HTML on the server.
  useEffect(() => {
    const t = setTimeout(() => {
      previewMarkdown(body)
        .then(setPreview)
        .catch(() => setPreview(""));
    }, 300);
    return () => clearTimeout(t);
  }, [body]);

  // The Markdown textarea has overflow:hidden and grows with its content so the
  // page (not the pane) is the only scroll container. Re-measure on every change
  // and whenever the split view toggles back into "write"/"split".
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body, view]);

  const wordCount = body.length;

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function doSave() {
    if (pending) return;
    setError("");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", title);
    fd.set("date", date);
    fd.set("tags", tags);
    fd.set("excerpt", excerpt);
    fd.set("sort", sort);
    fd.set("body", body);
    startTransition(async () => {
      try {
        await savePost(fd);
        setDirty(false);
        router.push("/admin/posts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    doSave();
  }

  // ⌘/Ctrl+S saves and stays on the page.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // doSave closes over the latest state via re-registration each render.
  });

  // Rich-text paste: convert the HTML clipboard payload to Markdown on the
  // server (turndown) and append to the body.
  function onImportPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (!html) return;
    e.preventDefault();
    setImporting(true);
    htmlToMarkdown(html)
      .then((md) => {
        setBody((b) => (b ? `${b}\n\n${md}` : md));
        markDirty();
        if (importRef.current) importRef.current.value = "";
      })
      .catch(() => setError("富文本转换失败"))
      .finally(() => setImporting(false));
  }

  // Image upload: post the file to the image-host API, then splice the
  // returned Markdown image tag into the body at the cursor.
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(f.name);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "上传失败");
      const md: string = data.markdown;
      const ta = bodyRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const sep = body && !body.endsWith("\n") ? "\n\n" : "";
        const next = body.slice(0, start) + sep + md + body.slice(end);
        setBody(next);
        markDirty();
        const pos = start + sep.length + md.length;
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(pos, pos);
        });
      } else {
        setBody((b) => (b ? `${b}\n\n${md}` : md));
        markDirty();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const panesClass = [
    "post-editor__panes",
    view === "write" ? "is-write-only" : "",
    view === "preview" ? "is-preview-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      ref={formRef}
      id="view-post-edit"
      className="post-editor is-active"
      onSubmit={onSubmit}
    >
      <div className="post-editor__bar">
        <div className="post-editor__bar-title">{isNew ? "新建文章" : "编辑文章"}</div>
        <div className="post-editor__bar-meta">
          {!isNew && <span className="id-chip mono">{post?.id}</span>}
          <span className="sep">·</span>
          <span>{dirty ? "未保存" : isNew ? "草稿" : "已同步"}</span>
        </div>
        <div className="post-editor__bar-actions">
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => router.push("/admin/posts")}
          >
            返回列表
          </button>
          <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      <div className="post-editor__meta">
        <div className="field">
          <label htmlFor="id">文章 ID</label>
          <input
            id="id"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              markDirty();
            }}
            readOnly={!isNew}
            required
            placeholder="如 webgl-scroll-orbit"
          />
        </div>
        <div className="field">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="date">日期</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              markDirty();
            }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tags">标签</label>
          <input
            id="tags"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              markDirty();
            }}
            placeholder="逗号或换行分隔"
          />
        </div>
        <div className="field">
          <label htmlFor="sort">排序</label>
          <input
            id="sort"
            type="number"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              markDirty();
            }}
          />
        </div>
        <div className="field field--excerpt">
          <label htmlFor="excerpt">摘要</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              markDirty();
            }}
          />
        </div>
      </div>

      <div className="post-editor__tools" role="toolbar" aria-label="编辑器视图">
        <span className="post-editor__tools-label">视图</span>
        <button
          type="button"
          className="tool-btn"
          aria-pressed={view === "split"}
          onClick={() => setView("split")}
        >
          分栏
        </button>
        <button
          type="button"
          className="tool-btn"
          aria-pressed={view === "write"}
          onClick={() => setView("write")}
        >
          只写
        </button>
        <button
          type="button"
          className="tool-btn"
          aria-pressed={view === "preview"}
          onClick={() => setView("preview")}
        >
          只预览
        </button>
        <span
          className="sep"
          style={{ width: 1, height: 14, background: "var(--border)", margin: "0 4px" }}
          aria-hidden="true"
        />
        <button
          type="button"
          className="tool-btn"
          aria-pressed={importOpen}
          onClick={() => setImportOpen((v) => !v)}
        >
          导入
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => fileRef.current?.click()}
          disabled={!!uploading}
          title="上传图片到图床并在光标处插入"
        >
          {uploading ? `上传中…` : "图片"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickImage}
          hidden
        />
        <div className="spacer" />
        <span className="hint-k">
          <kbd>⌘</kbd>
          <kbd>S</kbd> 保存
        </span>
      </div>

      <div className={`post-editor__import${importOpen ? " is-open" : ""}`}>
        <label htmlFor="import" className="post-editor__tools-label" style={{ margin: 0 }}>
          富文本导入
        </label>
        <textarea
          id="import"
          ref={importRef}
          onPaste={onImportPaste}
          placeholder={importing ? "转换中…" : "把网页/文档内容粘贴到此处，自动转 Markdown 并追加到正文"}
        />
        <p className="hint">粘贴纯文本无效；仅识别带格式的 HTML 内容。</p>
      </div>

      <div className={panesClass}>
        <div className="post-editor__pane post-editor__write">
          <div className="post-editor__pane-head">
            <span>Markdown</span>
            <span className="mono">{wordCount} 字</span>
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              markDirty();
            }}
            placeholder={"# 标题\n\n正文段落，支持 **加粗**、`代码`、列表、链接……"}
          />
        </div>
        <div className="post-editor__pane">
          <div className="post-editor__pane-head">
            <span>预览</span>
          </div>
          <div
            className="post-editor__preview"
            aria-label="预览"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
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
