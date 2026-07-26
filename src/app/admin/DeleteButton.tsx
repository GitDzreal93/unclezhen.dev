"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Generic delete button that invokes a server action taking the row id.
export default function DeleteButton({
  id,
  action,
  confirm: confirmMsg,
  label = "删除",
}: {
  id: string | number;
  action: (id: any) => Promise<void>;
  confirm: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm(confirmMsg)) return;
    startTransition(async () => {
      await action(id);
      router.refresh();
    });
  }

  return (
    <button
      className="admin-danger"
      type="button"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "…" : label}
    </button>
  );
}