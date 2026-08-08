"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post, Series, SeriesPost } from "@/lib/data";
import {
  saveSeries,
  addPostToSeries,
  removePostFromSeries,
  reorderSeriesPosts,
} from "@/lib/admin";
import { toast } from "@/components/toast";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// A draggable member row: grip handle + live position + title + date + remove.
function SortableMember({
  sp,
  onRemove,
  removing,
}: {
  sp: SeriesPost;
  onRemove: () => void;
  removing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sp.postId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li className="series-member" ref={setNodeRef} style={style}>
      <button
        type="button"
        className="series-member__handle"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className="mono series-member__pos">{sp.position + 1}</span>
      <span className="series-member__title">{sp.title}</span>
      <span className="mono series-member__date">{sp.date}</span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={onRemove}
        disabled={removing}
      >
        {removing ? "…" : "移除"}
      </button>
    </li>
  );
}

export default function SeriesForm({
  isNew,
  series,
  memberPosts,
  allPosts,
}: {
  isNew: boolean;
  series?: Series;
  memberPosts?: SeriesPost[];
  allPosts?: Post[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // A. meta form
  const [id, setId] = useState(series?.id ?? "");
  const [title, setTitle] = useState(series?.title ?? "");
  const [description, setDescription] = useState(series?.description ?? "");
  const [sort, setSort] = useState(String(series?.sort ?? 0));
  const [showNumber, setShowNumber] = useState(series?.showNumber ?? false);

  // B. members — local copy for optimistic reorder/add/remove (edit mode only)
  const [members, setMembers] = useState<SeriesPost[]>(memberPosts ?? []);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // C. add-post search
  const [addQ, setAddQ] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const memberIdSet = useMemo(() => new Set(members.map((m) => m.postId)), [members]);
  const candidates = useMemo(() => {
    const qq = addQ.trim().toLowerCase();
    return (allPosts ?? [])
      .filter((p) => !memberIdSet.has(p.id))
      .filter((p) => !qq || (p.id + " " + p.title).toLowerCase().includes(qq));
  }, [allPosts, memberIdSet, addQ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function saveMeta(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("sort", sort);
    fd.set("showNumber", String(showNumber));
    startTransition(async () => {
      try {
        await saveSeries(fd);
        if (isNew) router.push(`/admin/series/${id}`);
        else router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = members.findIndex((m) => m.postId === active.id);
    const to = members.findIndex((m) => m.postId === over.id);
    if (from < 0 || to < 0) return;
    // Compute next from the current closure value (not the setState updater)
    // so we can persist the new order synchronously.
    const next = arrayMove(members, from, to);
    setMembers(next);
    startTransition(async () => {
      try {
        await reorderSeriesPosts(series!.id, next.map((m) => m.postId));
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "排序失败");
        router.refresh(); // revert local to server truth
      }
    });
  }

  function addPost(p: Post) {
    if (addingId) return;
    setAddingId(p.id);
    // optimistic: append at the end
    setMembers((prev) => [
      ...prev,
      { postId: p.id, position: prev.length, title: p.title, date: p.date, tags: p.tags, excerpt: p.excerpt },
    ]);
    const fd = new FormData();
    fd.set("seriesId", series!.id);
    fd.set("postId", p.id);
    startTransition(async () => {
      try {
        await addPostToSeries(fd);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "添加失败");
        router.refresh();
      } finally {
        setAddingId(null);
      }
    });
  }

  function removeMember(postId: string) {
    if (removingId) return;
    setRemovingId(postId);
    setMembers((prev) => prev.filter((m) => m.postId !== postId));
    const fd = new FormData();
    fd.set("seriesId", series!.id);
    fd.set("postId", postId);
    startTransition(async () => {
      try {
        await removePostFromSeries(fd);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "移除失败");
        router.refresh();
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <form className="series-form" onSubmit={saveMeta}>
      <div className="post-editor__bar">
        <div className="post-editor__bar-title">{isNew ? "新建合集" : "编辑合集"}</div>
        <div className="post-editor__bar-actions">
          <Link className="btn btn--ghost btn--sm" href="/admin/series">
            返回列表
          </Link>
          <button className="btn btn--primary btn--sm" type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      {/* A. meta */}
      <div className="post-editor__meta">
        <div className="field">
          <label htmlFor="id">合集 ID</label>
          <input
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            readOnly={!isNew}
            required
            placeholder="如 llm-practice"
          />
        </div>
        <div className="field">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
          <label htmlFor="description">简介</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="series-checkbox">
            <input
              type="checkbox"
              checked={showNumber}
              onChange={(e) => setShowNumber(e.target.checked)}
            />{" "}
            展示文章序号（合集页列表显示 1. 2. 3.）
          </label>
        </div>
      </div>

      {isNew ? (
        <p className="hint" style={{ padding: "0 16px" }}>
          保存合集后，可在编辑页管理文章（添加、拖拽排序）。
        </p>
      ) : (
        <>
          {/* B. members with dnd-kit */}
          <div className="series-section">
            <h3 className="series-section__title">
              合集内文章（{members.length}）
              <span className="hint">拖动 ⠿ 调整顺序</span>
            </h3>
            {members.length === 0 ? (
              <p className="hint">还没有文章，从下方添加。</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                  items={members.map((m) => m.postId)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="series-members">
                    {members.map((m, i) => (
                      <SortableMember
                        key={m.postId}
                        sp={{ ...m, position: i }}
                        onRemove={() => removeMember(m.postId)}
                        removing={removingId === m.postId}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* C. add posts */}
          <div className="series-section">
            <h3 className="series-section__title">添加文章</h3>
            <input
              className="search"
              type="search"
              placeholder="搜索 ID / 标题…"
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
            />
            {candidates.length === 0 ? (
              <p className="hint">没有可添加的文章。</p>
            ) : (
              <ul className="series-candidates">
                {candidates.map((p) => (
                  <li key={p.id} className="series-candidate">
                    <span className="mono series-candidate__id">{p.id}</span>
                    <span className="series-candidate__title">{p.title}</span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => addPost(p)}
                      disabled={!!addingId}
                    >
                      {addingId === p.id ? "添加中…" : "添加"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="admin-login__err" style={{ padding: "8px 16px" }}>
          {error}
        </p>
      )}
    </form>
  );
}
