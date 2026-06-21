import { describe, it, expect } from "vitest";
import { profileName } from "@/lib/format";

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
});
