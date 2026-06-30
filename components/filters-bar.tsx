"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileName } from "@/lib/format";
import {
  EMPTY_FILTERS,
  filtersToParams,
  hasActiveFilters,
  type Filters,
} from "@/lib/filters";
import type { Label as LabelRow, Profile, Status } from "@/lib/db";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active
          ? "border-foreground bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function FiltersBar({
  initial,
  statuses,
  labels,
  profiles,
}: {
  initial: Filters;
  statuses: Status[];
  labels: LabelRow[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [f, setF] = useState<Filters>(initial);

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function apply(next: Filters) {
    // Preserve current sort while replacing filter params.
    const sp = new URLSearchParams();
    const sort = params.get("sort");
    const dir = params.get("dir");
    if (sort) sp.set("sort", sort);
    if (dir) sp.set("dir", dir);
    Object.entries(filtersToParams(next)).forEach(([k, v]) => sp.set(k, v));
    router.push(`${pathname}?${sp.toString()}`);
  }

  function clearAll() {
    setF(EMPTY_FILTERS);
    const sp = new URLSearchParams();
    const sort = params.get("sort");
    const dir = params.get("dir");
    if (sort) sp.set("sort", sort);
    if (dir) sp.set("dir", dir);
    router.push(sp.toString() ? `${pathname}?${sp.toString()}` : pathname);
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            value={f.q}
            placeholder="Search descriptions…"
            onChange={(e) => setF({ ...f, q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply(f)}
          />
        </div>
        <div className="w-44 space-y-1.5">
          <Label htmlFor="owner">Owner (any role)</Label>
          <select
            id="owner"
            value={f.owner}
            onChange={(e) => setF({ ...f, owner: e.target.value })}
            className={selectClass}
          >
            <option value="">Anyone</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {profileName(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36 space-y-1.5">
          <Label htmlFor="from">Date from</Label>
          <Input
            id="from"
            type="date"
            value={f.from}
            onChange={(e) => setF({ ...f, from: e.target.value })}
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label htmlFor="to">Date to</Label>
          <Input
            id="to"
            type="date"
            value={f.to}
            onChange={(e) => setF({ ...f, to: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Status
        </span>
        {statuses.map((s) => (
          <Chip
            key={s.id}
            active={f.statuses.includes(s.id)}
            onClick={() => setF({ ...f, statuses: toggle(f.statuses, s.id) })}
          >
            {s.label}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Chip active={f.stale} onClick={() => setF({ ...f, stale: !f.stale })}>
          Needs update
        </Chip>
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Labels
          </span>
          {labels.map((l) => (
            <Chip
              key={l.id}
              active={f.labels.includes(l.id)}
              onClick={() => setF({ ...f, labels: toggle(f.labels, l.id) })}
            >
              {l.name}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => apply(f)}>
          Apply filters
        </Button>
        {hasActiveFilters(f) && (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
