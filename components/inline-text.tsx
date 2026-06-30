"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setWorkItemDescription } from "@/lib/actions/work-items";
import { cn } from "@/lib/utils";

/**
 * Click-to-edit text cell for the items table, used for the description
 * (title). Display mode shows the text; clicking swaps in an input that
 * persists on Enter or blur and discards on Escape — the same click-to-edit
 * model as the status/owner/label cells. The description is required, so a
 * blank value is rejected server-side and the original text is kept.
 */
export function InlineText({
  itemId,
  value,
}: {
  itemId: string;
  value: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function commit(next: string) {
    setEditing(false);
    const trimmed = next.trim();
    if (trimmed === "" || trimmed === value) return;
    startTransition(async () => {
      const res = await setWorkItemDescription(itemId, trimmed);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={pending}
        aria-label="Edit description"
        className="w-full rounded px-1 py-0.5 text-left font-medium outline-none hover:bg-muted focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {value}
      </button>
    );
  }

  return (
    <input
      // Programmatic unmount (Enter/Escape flips `editing`) does not fire the
      // React blur handler, so Escape discards cleanly without a stray commit.
      autoFocus
      defaultValue={value}
      aria-label="Edit description"
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(e.currentTarget.value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
      className={cn(
        "w-full rounded border px-1 py-0.5 text-sm font-medium outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50",
      )}
    />
  );
}
