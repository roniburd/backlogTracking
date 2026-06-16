"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setWorkItemStatus } from "@/lib/actions/work-items";
import type { Status } from "@/lib/db";
import { statusDot } from "@/lib/status-color";
import { cn } from "@/lib/utils";

/** Inline status dropdown used in the table; persists immediately. */
export function InlineStatus({
  itemId,
  statusId,
  color,
  statuses,
}: {
  itemId: string;
  statusId: string | null;
  color: string | null;
  statuses: Pick<Status, "id" | "label" | "color">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", statusDot(color))} />
      <select
        aria-label="Status"
        value={statusId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const res = await setWorkItemStatus(itemId, next);
            if (res?.error) toast.error(res.error);
            else router.refresh();
          });
        }}
        className="-ml-1 max-w-[11rem] truncate rounded border-none bg-transparent px-1 py-0.5 text-sm hover:bg-muted focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="">No status</option>
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
