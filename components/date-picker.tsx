"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { formatISODateLong, parseISODate, toISODate } from "@/lib/calendar";

/**
 * A calendar date picker that posts its value through a hidden input, so it is
 * a drop-in replacement for `<input type="date" name=... />` inside a form. The
 * submitted value is an ISO `YYYY-MM-DD` string (empty when cleared), exactly
 * what the Server Action already expects for an optional date column. The
 * calendar itself works in `Date` objects; this component is the boundary that
 * converts to/from the ISO string the form contract uses.
 */
export function DatePicker({
  name,
  id,
  defaultValue,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    () => parseISODate(defaultValue) ?? undefined,
  );
  const [open, setOpen] = React.useState(false);

  const iso = date ? toISODate(date) : "";
  const label = iso ? formatISODateLong(iso) : "Pick a date";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* Submitted with the form; the visible control below is presentational. */}
      <input type="hidden" name={name} value={iso} />

      <PopoverPrimitive.Trigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between font-normal",
              !date && "text-muted-foreground",
            )}
          />
        }
      >
        {label}
        <CalendarIcon className="text-muted-foreground" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="start" sideOffset={4}>
          <PopoverPrimitive.Popup
            className="z-50 origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(next) => {
                setDate(next);
                if (next) setOpen(false);
              }}
              autoFocus
            />
            {date && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground"
                  onClick={() => {
                    setDate(undefined);
                    setOpen(false);
                  }}
                >
                  <XIcon />
                  Clear
                </Button>
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
