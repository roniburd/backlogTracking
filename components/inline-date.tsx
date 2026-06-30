"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { setWorkItemDate } from "@/lib/actions/work-items";
import { formatISODateLong, parseISODate, toISODate } from "@/lib/calendar";
import { DATE_TYPES } from "@/lib/inline-edit";
import { cn } from "@/lib/utils";

/**
 * Click-to-edit target-date cell for the items table. The cell shows the date
 * (and its type code) as plain text; clicking opens a popover with a calendar
 * and a DFD/ECD toggle. Edits are gathered locally and persisted once when the
 * popover closes — the same commit-on-close model as the inline label editor —
 * so picking a date and a type is a single write, not one per click.
 */
export function InlineDate({
  itemId,
  date,
  dateType,
}: {
  itemId: string;
  date: string | null;
  dateType: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  // Draft state seeded from the server truth each time the popover opens.
  const [draftDate, setDraftDate] = React.useState(date);
  const [draftType, setDraftType] = React.useState(dateType);
  // Set when the user presses Escape, so the close that follows discards rather
  // than commits — matching the Escape-cancels behavior of the other editors.
  const discard = React.useRef(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDraftDate(date);
      setDraftType(dateType);
      return;
    }
    // Closing: commit once if anything actually changed (unless discarding).
    const wasDiscard = discard.current;
    discard.current = false;
    if (wasDiscard) return;
    const changed =
      (draftDate ?? "") !== (date ?? "") || (draftType ?? "") !== (dateType ?? "");
    if (!changed) return;
    startTransition(async () => {
      const res = await setWorkItemDate(itemId, draftDate ?? "", draftType ?? "");
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  const selected = parseISODate(draftDate) ?? undefined;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger
        aria-label="Edit date"
        disabled={pending}
        className={cn(
          "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:opacity-50",
        )}
      >
        {date ? (
          <span>
            {formatISODateLong(date)}
            {dateType && <span className="ml-1 text-xs">({dateType})</span>}
          </span>
        ) : (
          "—"
        )}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="start" sideOffset={4}>
          <PopoverPrimitive.Popup
            onKeyDown={(e) => {
              if (e.key === "Escape") discard.current = true;
            }}
            className="z-50 origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(next) => setDraftDate(next ? toISODate(next) : null)}
              autoFocus
            />
            <div className="flex items-center gap-1 border-t p-2">
              {DATE_TYPES.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={draftType === t ? "secondary" : "ghost"}
                  size="sm"
                  // Toggle off if already selected.
                  onClick={() => setDraftType((cur) => (cur === t ? null : t))}
                >
                  {t}
                </Button>
              ))}
              {(draftDate || draftType) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground"
                  onClick={() => {
                    setDraftDate(null);
                    setDraftType(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
