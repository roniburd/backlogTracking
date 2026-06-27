// Pure, timezone-safe date helpers for the month-grid calendar picker.
//
// Calendar dates are passed around as `YYYY-MM-DD` strings (the shape Postgres
// `date` columns and the existing form already use). All math is done with the
// local-time `Date(year, monthIndex, day)` constructor and read back via the
// local getters — never `Date.toISOString()`, which would shift the day across
// time zones. Keeping this logic here (not in the component) makes it unit
// testable without a DOM, per docs/ARCHITECTURE.md.

export type DayCell = {
  /** `YYYY-MM-DD` for this cell. */
  iso: string;
  /** Day-of-month number (1–31). */
  day: number;
  /** False for the leading/trailing days that belong to an adjacent month. */
  inCurrentMonth: boolean;
};

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-time `Date` -> `YYYY-MM-DD` (no UTC shift). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Parse a strict `YYYY-MM-DD` string into a local-time `Date`, or `null` if it
 * is malformed or not a real calendar date (e.g. `2026-02-30`).
 */
export function parseISODate(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [year, month, day] = s.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  // Reject overflow (Feb 30 -> Mar 2, month 13, etc.) via round-trip check.
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function isValidISODate(s: string | null | undefined): boolean {
  return parseISODate(s) !== null;
}

/** Human-readable label, e.g. `Jun 27, 2026`. Empty string for invalid input. */
export function formatISODateLong(s: string | null | undefined): string {
  const d = parseISODate(s);
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Today as `YYYY-MM-DD` in the viewer's local time zone. */
export function todayISO(): string {
  return toISODate(new Date());
}

export function monthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] ?? "";
}

/** Shift a (year, monthIndex) pair by `delta` months, normalizing the year. */
export function addMonths(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

/**
 * Build a fixed 6-week (42-cell) grid for the given month, weeks starting on
 * Sunday. Leading/trailing cells carry the adjacent month's days so the grid is
 * always full and the layout height is stable.
 */
export function buildMonthMatrix(year: number, monthIndex: number): DayCell[][] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
  const weeks: DayCell[][] = [];

  for (let week = 0; week < 6; week++) {
    const row: DayCell[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const offset = week * 7 + weekday - firstWeekday;
      // Date normalizes negative/overflow day numbers into adjacent months.
      const cellDate = new Date(year, monthIndex, 1 + offset);
      row.push({
        iso: toISODate(cellDate),
        day: cellDate.getDate(),
        inCurrentMonth: cellDate.getMonth() === monthIndex,
      });
    }
    weeks.push(row);
  }

  return weeks;
}
