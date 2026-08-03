"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";

// Generic delete button that invokes a server action taking the row id.
// Catches any error from the action and surfaces it as a toast so callers
// don't have to remember to wrap. On success, refreshes the route.
export default function DeleteButton({
  id,
  action,
  confirm: confirmMsg,
  label = "删除",
  onSuccess,
}: {
  id: string | number;
  action: (id: any) => Promise<void>;
  confirm: string;
  label?: string;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm(confirmMsg)) return;
    startTransition(async () => {
      try {
        await action(id);
        if (onSuccess) onSuccess();
        else router.refresh();
      } catch (err) {
        console.error("delete failed", err);
        toast(err instanceof Error ? err.message : "删除失败");
      }
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
