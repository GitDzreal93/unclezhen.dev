"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SECTION_KIND_LABEL, type SectionKind } from "@/lib/issues-types";
import { deleteIssueSection, reorderIssueSections } from "@/lib/admin";
import DeleteButton from "../../../DeleteButton";

type Row = {
  id: string;
  kind: SectionKind;
  label: string;
  position: number;
  visible: boolean;
};

export default function SectionList({
  issueId,
  sections: initial,
}: {
  issueId: string;
  sections: Row[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Row[]>(initial);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === e.active.id);
    const newIdx = sections.findIndex((s) => s.id === e.over!.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(sections, oldIdx, newIdx);
    setSections(next);
    startTransition(async () => {
      try {
        await reorderIssueSections(issueId, next.map((s) => s.id));
        router.refresh();
      } catch (err) {
        // Revert on failure.
        setSections(initial);
        alert(String((err as Error).message || err));
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="section-list">
          {sections.map((s) => (
            <SortableRow key={s.id} section={s} issueId={issueId} />
          ))}
        </div>
      </SortableContext>
      {pending && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>保存排序…</p>}
    </DndContext>
  );
}

function SortableRow({ section, issueId }: { section: Row; issueId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const label = SECTION_KIND_LABEL[section.kind]?.zh || section.kind;
  return (
    <div ref={setNodeRef} style={style} className="section-card">
      <button
        type="button"
        className="section-card__handle"
        aria-label="拖动以重排"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="section-card__body">
        <div className="section-card__title">
          <span className="mono section-card__kind">{section.kind}</span>
          <strong>{label}</strong>
          {section.label && section.label !== label && (
            <span className="muted" style={{ fontSize: 12 }}>· {section.label}</span>
          )}
        </div>
        <div className="section-card__meta">
          <span className="mono">pos {section.position}</span>
          {section.visible ? (
            <span className="admin-pill admin-pill--ok">显示</span>
          ) : (
            <span className="admin-pill admin-pill--warn">隐藏</span>
          )}
        </div>
      </div>
      <div className="section-card__actions">
        <Link
          className="btn btn--ghost btn--sm"
          href={`/admin/issues/${issueId}/sections/${section.kind}`}
        >
          编辑
        </Link>
        <DeleteButton
          id={section.id}
          action={deleteIssueSection}
          confirm={`删除板块「${label}」？`}
        />
      </div>
    </div>
  );
}
