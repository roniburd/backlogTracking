import { describe, it, expect } from "vitest";

import {
  addMonths,
  buildMonthMatrix,
  formatISODateLong,
  isValidISODate,
  parseISODate,
  toISODate,
} from "@/lib/calendar";

describe("toISODate", () => {
  it("formats a local date without a UTC shift", () => {
    // Local midnight on the 1st must stay the 1st, not roll back a day.
    expect(toISODate(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(toISODate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("zero-pads month and day", () => {
    expect(toISODate(new Date(2026, 2, 9))).toBe("2026-03-09");
  });
});

describe("parseISODate", () => {
  it("parses a valid date into matching local components", () => {
    const d = parseISODate("2026-06-27");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(5);
    expect(d!.getDate()).toBe(27);
  });

  it("accepts a leap day", () => {
    expect(parseISODate("2024-02-29")).not.toBeNull();
  });

  it.each([
    null,
    undefined,
    "",
    "2026-13-01", // month out of range
    "2026-02-30", // day overflows into March
    "2023-02-29", // not a leap year
    "2026-6-27", // not zero-padded
    "06/27/2026", // wrong separator
    "garbage",
  ])("rejects invalid input: %s", (input) => {
    expect(parseISODate(input as string)).toBeNull();
    expect(isValidISODate(input as string)).toBe(false);
  });
});

describe("formatISODateLong", () => {
  it("renders a friendly label for a valid date", () => {
    expect(formatISODateLong("2026-06-27")).toBe("Jun 27, 2026");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatISODateLong("not-a-date")).toBe("");
    expect(formatISODateLong(null)).toBe("");
  });
});

describe("addMonths", () => {
  it("advances within a year", () => {
    expect(addMonths(2026, 0, 1)).toEqual({ year: 2026, monthIndex: 1 });
  });

  it("wraps forward across the year boundary", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
  });

  it("wraps backward across the year boundary", () => {
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });
});

describe("buildMonthMatrix", () => {
  it("always returns a stable 6x7 grid", () => {
    const grid = buildMonthMatrix(2026, 5);
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("places the 1st of the month in the correct weekday column", () => {
    // June 1, 2026 is a Monday (weekday index 1).
    const grid = buildMonthMatrix(2026, 5);
    const first = grid.flat().find((c) => c.iso === "2026-06-01")!;
    expect(first.inCurrentMonth).toBe(true);
    expect(grid[0][1].iso).toBe("2026-06-01");
    // The cell before it belongs to the previous month.
    expect(grid[0][0].iso).toBe("2026-05-31");
    expect(grid[0][0].inCurrentMonth).toBe(false);
  });

  it("covers every day of the month exactly once", () => {
    const grid = buildMonthMatrix(2024, 1); // Feb 2024, a leap year
    const inMonth = grid.flat().filter((c) => c.inCurrentMonth);
    expect(inMonth.map((c) => c.day)).toEqual(
      Array.from({ length: 29 }, (_, i) => i + 1),
    );
  });

  it("flags leading and trailing days as outside the month", () => {
    const grid = buildMonthMatrix(2026, 5);
    const flat = grid.flat();
    const trailing = flat.filter((c) => c.iso.startsWith("2026-07"));
    expect(trailing.length).toBeGreaterThan(0);
    for (const c of trailing) expect(c.inCurrentMonth).toBe(false);
  });
});
