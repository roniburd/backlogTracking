"use client";

import * as React from "react";
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Month-grid calendar — a thin wrapper over `react-day-picker`, styled to the
 * design system. We deliberately do not hand-roll the grid math, month paging,
 * keyboard navigation, or accessibility: the library has already hardened all
 * of that, and we need no customization beyond styling. See CLAUDE.md on when a
 * battle-tested dependency is the lower-liability choice over reimplementing it.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-4", defaults.months),
        month: cn("flex w-full flex-col gap-4", defaults.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaults.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          defaults.button_next,
        ),
        month_caption: cn(
          "flex h-7 items-center justify-center px-8",
          defaults.month_caption,
        ),
        caption_label: cn("text-sm font-medium", defaults.caption_label),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "w-8 text-[0.8rem] font-normal text-muted-foreground",
          defaults.weekday,
        ),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("size-8 p-0 text-center text-sm", defaults.day),
        today: cn(
          "rounded-md font-medium ring-1 ring-inset ring-border data-[selected=true]:ring-0",
          defaults.today,
        ),
        outside: cn("text-muted-foreground/50", defaults.outside),
        disabled: cn("text-muted-foreground/30", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", chevronClassName)} />
          ) : (
            <ChevronRightIcon className={cn("size-4", chevronClassName)} />
          ),
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

/**
 * A single day cell. Styled with the shared button variants so days match the
 * rest of the UI; the effect keeps keyboard focus on the day the library marks
 * as focused, which is how arrow-key navigation stays visible.
 */
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  void day; // provided by the library; not needed beyond styling/modifiers.

  return (
    <button
      ref={ref}
      data-selected={modifiers.selected || undefined}
      className={cn(
        buttonVariants({
          variant: modifiers.selected ? "default" : "ghost",
          size: "icon-sm",
        }),
        "size-8 font-normal",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
