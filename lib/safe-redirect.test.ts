import { describe, it, expect } from "vitest";
import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("returns a plain root-relative path unchanged", () => {
    expect(safeInternalPath("/items", "/fallback")).toBe("/items");
  });

  it("preserves the query string", () => {
    expect(safeInternalPath("/items?status=open,done&q=api", "/fallback")).toBe(
      "/items?status=open,done&q=api",
    );
  });

  it("preserves a fragment/hash", () => {
    expect(safeInternalPath("/items#row-3", "/fallback")).toBe("/items#row-3");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(safeInternalPath("  /items  ", "/fallback")).toBe("/items");
  });

  it("falls back on null/undefined/empty", () => {
    expect(safeInternalPath(null, "/items")).toBe("/items");
    expect(safeInternalPath(undefined, "/items")).toBe("/items");
    expect(safeInternalPath("", "/items")).toBe("/items");
  });

  it("falls back on absolute URLs", () => {
    expect(safeInternalPath("https://evil.com", "/items")).toBe("/items");
    expect(safeInternalPath("http://evil.com/items", "/items")).toBe("/items");
  });

  it("falls back on protocol-relative URLs", () => {
    expect(safeInternalPath("//evil.com", "/items")).toBe("/items");
  });

  it("falls back on backslash escape tricks", () => {
    expect(safeInternalPath("/\\evil.com", "/items")).toBe("/items");
    expect(safeInternalPath("\\/evil.com", "/items")).toBe("/items");
  });

  it("falls back on paths with embedded control characters or whitespace", () => {
    expect(safeInternalPath("/items\n/evil", "/items")).toBe("/items");
    expect(safeInternalPath("/it ems", "/items")).toBe("/items");
  });

  it("falls back on non-root-relative paths", () => {
    expect(safeInternalPath("items", "/items")).toBe("/items");
  });
});
