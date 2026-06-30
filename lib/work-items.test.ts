import { describe, expect, it } from "vitest";

import { duplicateWorkItemFields } from "@/lib/work-items";

const source = {
  description: "Ship the new dashboard",
  status_id: "11111111-1111-1111-1111-111111111111",
  pm_owner: "22222222-2222-2222-2222-222222222222",
  tech_lead_owner: "33333333-3333-3333-3333-333333333333",
  sdm_owner: "44444444-4444-4444-4444-444444444444",
  target_date: "2026-07-01",
  date_type: "ECD" as const,
};

describe("duplicateWorkItemFields", () => {
  it("prefixes the description with 'Copy of '", () => {
    expect(duplicateWorkItemFields(source).description).toBe(
      "Copy of Ship the new dashboard",
    );
  });

  it("carries over status, owners, target date, and date type", () => {
    const copy = duplicateWorkItemFields(source);
    expect(copy.status_id).toBe(source.status_id);
    expect(copy.pm_owner).toBe(source.pm_owner);
    expect(copy.tech_lead_owner).toBe(source.tech_lead_owner);
    expect(copy.sdm_owner).toBe(source.sdm_owner);
    expect(copy.target_date).toBe(source.target_date);
    expect(copy.date_type).toBe(source.date_type);
  });

  it("preserves null fields without inventing values", () => {
    const copy = duplicateWorkItemFields({
      description: "Bare item",
      status_id: null,
      pm_owner: null,
      tech_lead_owner: null,
      sdm_owner: null,
      target_date: null,
      date_type: null,
    });
    expect(copy).toEqual({
      description: "Copy of Bare item",
      status_id: null,
      pm_owner: null,
      tech_lead_owner: null,
      sdm_owner: null,
      target_date: null,
      date_type: null,
    });
  });

  it("does not carry over history or identity columns", () => {
    // The returned payload is exactly the duplicable fields — nothing tied to
    // the original's history (comments/latest_update), identity, stack rank, or
    // timestamps leaks in. Those are re-established on insert.
    const copy = duplicateWorkItemFields(source);
    expect(Object.keys(copy).sort()).toEqual(
      [
        "date_type",
        "description",
        "pm_owner",
        "sdm_owner",
        "status_id",
        "target_date",
        "tech_lead_owner",
      ].sort(),
    );
  });
});
