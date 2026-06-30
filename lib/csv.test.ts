import { describe, it, expect } from "vitest";
import {
  buildItemsCsv,
  csvByteSize,
  escapeCsvField,
  formatBytes,
  CSV_MAX_BYTES,
} from "@/lib/csv";
import type { WorkItemRow } from "@/lib/db";

/** A fully-empty view row; tests override only the fields they care about. */
function row(overrides: Partial<WorkItemRow> = {}): WorkItemRow {
  return {
    created_at: null,
    created_by: null,
    date_type: null,
    description: null,
    id: null,
    label_ids: null,
    label_names: null,
    last_activity_at: null,
    last_comment_at: null,
    last_status_change_at: null,
    latest_update: null,
    pm_email: null,
    pm_name: null,
    pm_owner: null,
    sdm_email: null,
    sdm_name: null,
    sdm_owner: null,
    stack_rank: null,
    status_color: null,
    status_id: null,
    status_is_attention: null,
    status_is_terminal: null,
    status_label: null,
    status_sort_order: null,
    target_date: null,
    tech_lead_email: null,
    tech_lead_name: null,
    tech_lead_owner: null,
    updated_at: null,
    ...overrides,
  };
}

describe("escapeCsvField", () => {
  it("leaves a plain value untouched", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("quotes and doubles embedded quotes", () => {
    expect(escapeCsvField('she said "hi"')).toBe('"she said ""hi"""');
  });

  it("quotes values containing a comma", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
  });

  it("quotes values containing a newline", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes a leading = to prevent formula injection", () => {
    expect(escapeCsvField("=1+1")).toBe("'=1+1");
  });

  it("neutralizes other formula-trigger prefixes (+ - @)", () => {
    expect(escapeCsvField("+x")).toBe("'+x");
    expect(escapeCsvField("-x")).toBe("'-x");
    expect(escapeCsvField("@x")).toBe("'@x");
  });

  it("quotes a guarded value that also needs quoting", () => {
    expect(escapeCsvField("=SUM(A1,B1)")).toBe('"\'=SUM(A1,B1)"');
  });
});

describe("buildItemsCsv", () => {
  it("emits a header row even with no data rows", () => {
    const csv = buildItemsCsv([]);
    expect(csv).toBe(
      "#,Description,Status,PM,Tech Lead,SDM,Target date,Date type,Labels,Latest update,Last activity\r\n",
    );
  });

  it("renders a row's fields in column order", () => {
    const csv = buildItemsCsv([
      row({
        stack_rank: 3,
        description: "Ship CSV export",
        status_label: "In progress",
        pm_name: "Ada Lovelace",
        pm_email: "ada@x.io",
        target_date: "2026-07-01",
        date_type: "hard",
        label_names: ["urgent", "infra"],
        last_activity_at: "2026-06-30T12:00:00Z",
      }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe(
      "3,Ship CSV export,In progress,Ada Lovelace,,,2026-07-01,hard,urgent; infra,,2026-06-30T12:00:00Z",
    );
  });

  it("falls back to email when an owner has no name", () => {
    const csv = buildItemsCsv([
      row({ pm_name: null, pm_email: "owner@x.io" }),
    ]);
    expect(csv.split("\r\n")[1]).toContain("owner@x.io");
  });

  it("escapes a description containing commas and quotes", () => {
    const csv = buildItemsCsv([row({ description: 'fix "bug", urgent' })]);
    expect(csv.split("\r\n")[1]).toBe(
      ',"fix ""bug"", urgent",,,,,,,,,',
    );
  });

  it("terminates the document with CRLF", () => {
    expect(buildItemsCsv([row({ description: "x" })]).endsWith("\r\n")).toBe(
      true,
    );
  });
});

describe("csvByteSize", () => {
  it("counts ASCII as one byte each", () => {
    expect(csvByteSize("abc")).toBe(3);
  });

  it("counts multi-byte UTF-8 characters by their byte length", () => {
    // "é" is two bytes in UTF-8.
    expect(csvByteSize("é")).toBe(2);
  });
});

describe("CSV_MAX_BYTES", () => {
  it("is 2 MB", () => {
    expect(CSV_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(CSV_MAX_BYTES)).toBe("2.0 MB");
  });
});
