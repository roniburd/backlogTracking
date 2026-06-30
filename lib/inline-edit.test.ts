import { describe, it, expect } from "vitest";
import {
  DATE_TYPES,
  OWNER_FIELDS,
  filterLabelSuggestions,
  isDateType,
  isOwnerField,
} from "@/lib/inline-edit";

describe("isOwnerField", () => {
  it("accepts each editable owner column", () => {
    for (const f of OWNER_FIELDS) expect(isOwnerField(f)).toBe(true);
  });

  it("rejects columns that are not owner fields", () => {
    // The allowlist exists to keep the inline-edit action from writing arbitrary
    // columns, so these must all be refused.
    expect(isOwnerField("status_id")).toBe(false);
    expect(isOwnerField("created_by")).toBe(false);
    expect(isOwnerField("id")).toBe(false);
    expect(isOwnerField("")).toBe(false);
    expect(isOwnerField("pm_owner; drop table")).toBe(false);
  });
});

describe("isDateType", () => {
  it("accepts each allowed date type", () => {
    for (const t of DATE_TYPES) expect(isDateType(t)).toBe(true);
  });

  it("rejects anything outside the allowlist", () => {
    // The inline date action validates the type against this list before
    // writing, so unknown codes and injection attempts must be refused.
    expect(isDateType("dfd")).toBe(false);
    expect(isDateType("OTHER")).toBe(false);
    expect(isDateType("")).toBe(false);
    expect(isDateType("DFD'; drop table")).toBe(false);
  });
});

describe("filterLabelSuggestions", () => {
  const labels = [
    { id: "a", name: "Backend" },
    { id: "b", name: "Bug" },
    { id: "c", name: "Frontend" },
    { id: "d", name: "Infra" },
  ];

  it("matches by case-insensitive substring", () => {
    expect(filterLabelSuggestions(labels, "end", []).map((l) => l.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filterLabelSuggestions(labels, "FRONT", []).map((l) => l.id)).toEqual(
      ["c"],
    );
  });

  it("excludes already-selected labels", () => {
    expect(
      filterLabelSuggestions(labels, "", ["a", "b"]).map((l) => l.id),
    ).toEqual(["c", "d"]);
  });

  it("lists all unselected labels for an empty or whitespace query", () => {
    expect(filterLabelSuggestions(labels, "   ", []).map((l) => l.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("preserves input order and caps at the limit", () => {
    expect(filterLabelSuggestions(labels, "", [], 2).map((l) => l.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns nothing when no name matches", () => {
    expect(filterLabelSuggestions(labels, "zzz", [])).toEqual([]);
  });
});
