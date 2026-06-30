import { describe, it, expect } from "vitest";
import { isValidEmail } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects empty or whitespace", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects a missing @ or domain dot", () => {
    expect(isValidEmail("ada")).toBe(false);
    expect(isValidEmail("ada@example")).toBe(false);
    expect(isValidEmail("ada@.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects internal whitespace", () => {
    expect(isValidEmail("ada @example.com")).toBe(false);
    expect(isValidEmail("ada@ex ample.com")).toBe(false);
  });
});
