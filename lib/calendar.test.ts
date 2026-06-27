import { describe, it, expect } from "vitest";

import { formatISODateLong, parseISODate, toISODate } from "@/lib/calendar";

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

  it("round-trips through toISODate", () => {
    expect(toISODate(parseISODate("2026-06-27")!)).toBe("2026-06-27");
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
