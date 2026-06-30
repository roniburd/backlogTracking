"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { setWorkItemLabels } from "@/lib/actions/work-items";
import type { Label } from "@/lib/db";
import { filterLabelSuggestions } from "@/lib/inline-edit";
import { cn } from "@/lib/utils";

type LabelLite = Pick<Label, "id" | "name">;

const chipClass =
  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground";

/**
 * Click-to-edit labels cell for the items table. Display mode shows the label
 * chips; clicking enters edit mode where each chip gets a small "x" to remove
 * it and a text input offers autocomplete suggestions from the label catalog.
 * Changes persist on blur (click away) and are discarded on Escape.
 *
 * Suggestions come only from the existing catalog: the `labels` table is
 * admin-managed (RLS), so attaching an existing label is open to everyone but
 * minting a brand-new label from free text is intentionally not offered here.
 */
export function InlineLabels({
  itemId,
  selected,
  catalog,
}: {
  itemId: string;
  /** Currently attached labels (server truth). */
  selected: LabelLite[];
  /** Full label catalog for suggestions. */
  catalog: LabelLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [ids, setIds] = useState<string[]>(() => selected.map((l) => l.id));
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const byId = new Map(catalog.map((l) => [l.id, l] as const));
  const chips = ids
    .map((id) => byId.get(id))
    .filter((l): l is LabelLite => Boolean(l));
  const suggestions = filterLabelSuggestions(catalog, query, ids);

  function open() {
    setIds(selected.map((l) => l.id));
    setQuery("");
    setEditing(true);
  }

  function add(id: string) {
    setIds((cur) => (cur.includes(id) ? cur : [...cur, id]));
    setQuery("");
  }

  function commit(nextIds: string[]) {
    setEditing(false);
    setQuery("");
    const before = selected.map((l) => l.id).sort().join(",");
    const after = [...nextIds].sort().join(",");
    if (before === after) return;
    startTransition(async () => {
      const res = await setWorkItemLabels(itemId, nextIds);
      if (res?.error) toast.error(res.error);
      else router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        disabled={pending}
        aria-label="Edit labels"
        className="flex w-full flex-wrap gap-1 rounded px-1 py-0.5 text-left outline-none hover:bg-muted focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <PlusIcon className="size-3" /> Labels
          </span>
        ) : (
          selected.map((l) => (
            <span key={l.id} className={chipClass}>
              {l.name}
            </span>
          ))
        )}
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
          commit(ids);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
          setQuery("");
        }
      }}
      className="space-y-1"
    >
      <div className="flex flex-wrap items-center gap-1 rounded border px-1 py-0.5">
        {chips.map((l) => (
          <span key={l.id} className={cn(chipClass, "text-foreground")}>
            {l.name}
            <button
              type="button"
              aria-label={`Remove ${l.name}`}
              onClick={() => setIds((cur) => cur.filter((id) => id !== l.id))}
              className="-mr-0.5 rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) add(suggestions[0].id);
            } else if (e.key === "Backspace" && query === "" && ids.length) {
              setIds((cur) => cur.slice(0, -1));
            }
          }}
          placeholder={chips.length ? "Add…" : "Add label…"}
          aria-label="Add label"
          className="h-5 min-w-16 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="rounded-md border bg-popover p-1 text-popover-foreground shadow-sm">
          {suggestions.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                // Keep focus inside the container so the blur-to-commit handler
                // doesn't fire before the click registers.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(l.id)}
                className="block w-full rounded px-1.5 py-0.5 text-left text-xs outline-none hover:bg-muted focus-visible:bg-muted"
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
