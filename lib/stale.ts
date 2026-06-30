// Staleness is the single rule for "this item needs an update": its last
// activity is older than STALE_DAYS. The dashboard surfaces stale items and the
// items list filters by them (`stale=1`), so the rule lives here once.

export const STALE_DAYS = 14;

const STALE_MS = STALE_DAYS * 86_400_000;

/** ISO timestamp on/before which an item counts as stale, given a reference time. */
export function staleCutoff(now: number = Date.now()): string {
  return new Date(now - STALE_MS).toISOString();
}

/** True when the last activity is older than STALE_DAYS (never for unknown activity). */
export function isStale(lastActivityIso: string | null, now: number = Date.now()): boolean {
  if (!lastActivityIso) return false;
  return new Date(lastActivityIso).getTime() < now - STALE_MS;
}
