// Timezone-safe conversion between the form's `YYYY-MM-DD` strings and the
// `Date` objects `react-day-picker` works with.
//
// The grid math, month paging, and weekday layout live in the calendar library
// (see components/ui/calendar.tsx) — there is no reason to hand-roll that. What
// stays here is the boundary logic the library does *not* cover: the strict
// `YYYY-MM-DD` <-> `Date` round-trip the form contract depends on. All math uses
// the local-time `Date(year, monthIndex, day)` constructor and the local getters
// — never `Date.toISOString()`, which would shift the day across time zones.
// Keeping it here (not in the component) makes it unit testable without a DOM,
// per docs/ARCHITECTURE.md.

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
