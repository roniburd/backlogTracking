"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { SortKey } from "@/lib/sort";
import { cn } from "@/lib/utils";

/** Clickable column header that toggles sort while preserving other params. */
export function SortHeader({
  sortKey,
  label,
  className,
}: {
  sortKey: SortKey;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeSort = params.get("sort") ?? "rank";
  const activeDir = params.get("dir") ?? "asc";
  const isActive = activeSort === sortKey;

  function onClick() {
    const next = new URLSearchParams(params);
    const nextDir = isActive && activeDir === "asc" ? "desc" : "asc";
    next.set("sort", sortKey);
    next.set("dir", nextDir);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-left font-medium hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      {isActive &&
        (activeDir === "asc" ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        ))}
    </button>
  );
}
