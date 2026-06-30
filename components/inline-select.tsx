"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setWorkItemOwner, setWorkItemStatus } from "@/lib/actions/work-items";
import type { OwnerField } from "@/lib/inline-edit";
import { statusDot } from "@/lib/status-color";
import { cn } from "@/lib/utils";

export type InlineOption = { value: string; label: string; color?: string | null };

/**
 * Click-to-edit single-select cell for the items table. The cell shows the
 * current value as plain text; clicking opens a dropdown (no persistent edit
 * affordance, per the issue) that persists the choice immediately. Used for
 * status and the owner columns; `field` picks which Server Action runs and is
 * validated server-side against an allowlist.
 */
export function InlineSelect({
  itemId,
  field,
  value,
  options,
  placeholder,
  ariaLabel,
  color,
  showDot = false,
}: {
  itemId: string;
  field: "status" | OwnerField;
  /** Current option value; empty string means "none". */
  value: string;
  options: InlineOption[];
  /** Shown when nothing is selected, and as the "clear" choice. */
  placeholder: string;
  ariaLabel: string;
  /** Status color of the *current* value, for the trigger dot. */
  color?: string | null;
  /** Render a status color dot (status column only). */
  showDot?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const current = options.find((o) => o.value === value);

  function save(next: string) {
    if (next === value) return;
    startTransition(async () => {
      const res =
        field === "status"
          ? await setWorkItemStatus(itemId, next)
          : await setWorkItemOwner(itemId, field, next);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        disabled={pending}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:opacity-50",
          !current && "text-muted-foreground",
        )}
      >
        {showDot && (
          <span
            className={cn("size-2 shrink-0 rounded-full", statusDot(color))}
          />
        )}
        <span className="truncate">{current?.label ?? placeholder}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => save(v)}>
          <DropdownMenuRadioItem value="">
            <span className="text-muted-foreground">{placeholder}</span>
          </DropdownMenuRadioItem>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {showDot ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", statusDot(o.color))}
                  />
                  {o.label}
                </span>
              ) : (
                o.label
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
