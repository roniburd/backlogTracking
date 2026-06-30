import { describe, it, expect } from "vitest";
import { STALE_DAYS, isStale, staleCutoff } from "@/lib/stale";

const NOW = Date.parse("2026-06-30T00:00:00.000Z");
const day = 86_400_000;

describe("isStale", () => {
  it("is false for unknown activity", () => {
    expect(isStale(null, NOW)).toBe(false);
  });

  it("is false when activity is more recent than the threshold", () => {
    expect(isStale(new Date(NOW - (STALE_DAYS - 1) * day).toISOString(), NOW)).toBe(false);
  });

  it("is true when activity is older than the threshold", () => {
    expect(isStale(new Date(NOW - (STALE_DAYS + 1) * day).toISOString(), NOW)).toBe(true);
  });
});

describe("staleCutoff", () => {
  it("returns the timestamp STALE_DAYS before now", () => {
    expect(staleCutoff(NOW)).toBe(new Date(NOW - STALE_DAYS * day).toISOString());
  });
});
