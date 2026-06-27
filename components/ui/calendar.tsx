"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  addMonths,
  buildMonthMatrix,
  monthName,
  parseISODate,
  todayISO,
  WEEKDAY_LABELS,
} from "@/lib/calendar";

/**
 * A month-grid calendar. Controlled by `value` (an ISO `YYYY-MM-DD` string or
 * null); calls `onSelect` with the clicked day's ISO string. The displayed
 * month tracks the selected value but the user can page through months freely.
 */
export function Calendar({
  value,
  onSelect,
  className,
}: {
  value: string | null;
  onSelect: (iso: string) => void;
  className?: string;
}) {
  const selected = parseISODate(value);
  const today = todayISO();

  // Initialize the visible month from the selected value, else today.
  const initial = selected ?? new Date();
  const [view, setView] = React.useState({
    year: initial.getFullYear(),
    monthIndex: initial.getMonth(),
  });

  const weeks = buildMonthMatrix(view.year, view.monthIndex);

  return (
    <div className={cn("w-64 select-none p-3", className)}>
      <div className="flex items-center justify-between pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => setView((v) => addMonths(v.year, v.monthIndex, -1))}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="text-sm font-medium" aria-live="polite">
          {monthName(view.monthIndex)} {view.year}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => setView((v) => addMonths(v.year, v.monthIndex, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1 font-normal">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map((cell) => {
          const isSelected = value === cell.iso;
          const isToday = today === cell.iso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                cell.inCurrentMonth
                  ? "text-foreground"
                  : "text-muted-foreground/50",
                !isSelected && "hover:bg-muted",
                isToday &&
                  !isSelected &&
                  "font-medium ring-1 ring-inset ring-border",
                isSelected &&
                  "bg-primary font-medium text-primary-foreground hover:bg-primary/80",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
