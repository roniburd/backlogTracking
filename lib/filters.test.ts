import { describe, it, expect } from "vitest";
import {
  applyFilters,
  filtersToParams,
  parseFilters,
  EMPTY_FILTERS,
} from "@/lib/filters";

describe("parseFilters", () => {
  it("defaults stale to false when absent", () => {
    expect(parseFilters({}).stale).toBe(false);
  });

  it("reads stale=1 as true", () => {
    expect(parseFilters({ stale: "1" }).stale).toBe(true);
  });

  it("treats any other stale value as false", () => {
    expect(parseFilters({ stale: "true" }).stale).toBe(false);
    expect(parseFilters({ stale: "0" }).stale).toBe(false);
  });
});

describe("filtersToParams", () => {
  it("omits stale when false", () => {
    expect(filtersToParams(EMPTY_FILTERS).stale).toBeUndefined();
  });

  it("serializes stale to '1' when true", () => {
    expect(filtersToParams({ ...EMPTY_FILTERS, stale: true }).stale).toBe("1");
  });

  it("round-trips the dashboard 'needs an update' link", () => {
    // The dashboard links to /items?owner=<id>&stale=1; parsing then
    // re-serializing must preserve both filters.
    const parsed = parseFilters({ owner: "u1", stale: "1" });
    expect(filtersToParams(parsed)).toEqual({ owner: "u1", stale: "1" });
  });
});

describe("applyFilters", () => {
  // Records the calls a real PostgREST builder would receive.
  function recorder() {
    const calls: Array<[string, ...unknown[]]> = [];
    const q = new Proxy(
      {},
      {
        get(_t, method: string) {
          return (...args: unknown[]) => {
            calls.push([method, ...args]);
            return q;
          };
        },
      },
    );
    return { q, calls };
  }

  it("adds a last_activity_at upper bound when stale is set", () => {
    const { q, calls } = recorder();
    applyFilters(q as never, { ...EMPTY_FILTERS, stale: true });
    const lte = calls.find((c) => c[0] === "lte");
    expect(lte?.[1]).toBe("last_activity_at");
    expect(typeof lte?.[2]).toBe("string");
  });

  it("does not touch last_activity_at when stale is unset", () => {
    const { q, calls } = recorder();
    applyFilters(q as never, EMPTY_FILTERS);
    expect(calls.some((c) => c[0] === "lte")).toBe(false);
  });
});
