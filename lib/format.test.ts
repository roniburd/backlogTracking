import { describe, it, expect } from "vitest";
import { ownerLabel, profileName, truncate } from "@/lib/format";

// Seed test that also documents the intended fallback chain for profileName.
describe("profileName", () => {
  it("prefers full_name when present", () => {
    expect(
      profileName({ full_name: "Ada Lovelace", email: "ada@x.io", id: "abcd1234ef" }),
    ).toBe("Ada Lovelace");
  });

  it("falls back to email when full_name is empty", () => {
    expect(
      profileName({ full_name: "", email: "ada@x.io", id: "abcd1234ef" }),
    ).toBe("ada@x.io");
  });

  it("falls back to a short id when name and email are empty", () => {
    expect(
      profileName({ full_name: "", email: "", id: "abcd1234ef5678" }),
    ).toBe("abcd1234");
  });

  it("treats a whitespace-only name as absent", () => {
    expect(
      profileName({ full_name: "   ", email: "ada@x.io", id: "abcd1234ef" }),
    ).toBe("ada@x.io");
  });
});

describe("ownerLabel", () => {
  it("prefers the friendly name when present", () => {
    expect(ownerLabel("Ada Lovelace", "ada@x.io")).toBe("Ada Lovelace");
  });

  it("falls back to email when the name is null, empty, or whitespace", () => {
    expect(ownerLabel(null, "ada@x.io")).toBe("ada@x.io");
    expect(ownerLabel("", "ada@x.io")).toBe("ada@x.io");
    expect(ownerLabel("   ", "ada@x.io")).toBe("ada@x.io");
  });

  it("falls back to an em dash when neither name nor email is set", () => {
    expect(ownerLabel(null, null)).toBe("—");
    expect(ownerLabel("  ", "")).toBe("—");
  });
});

describe("truncate", () => {
  it("returns text unchanged when shorter than max", () => {
    expect(truncate("hi", 5)).toBe("hi");
  });

  it("returns text unchanged when exactly max", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("keeps max-1 characters plus an ellipsis when longer than max", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
  });

  it("collapses to just an ellipsis when max is 1", () => {
    expect(truncate("hello", 1)).toBe("…");
  });
});
