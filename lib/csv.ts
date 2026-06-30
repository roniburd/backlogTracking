import type { WorkItemRow } from "@/lib/db";

/** Hard cap on a generated CSV download: 2 MB of UTF-8 bytes. */
export const CSV_MAX_BYTES = 2 * 1024 * 1024;

/** Fields that, as a row's value, would be interpreted as a spreadsheet formula. */
const INJECTION_PREFIX = /^[=+\-@\t\r]/;

/** A field needs RFC 4180 quoting when it contains a quote, comma, or newline. */
const NEEDS_QUOTING = /[",\r\n]/;

/** RFC 4180 uses CRLF between records. */
const ROW_SEP = "\r\n";

/**
 * Escape a single CSV field. First neutralizes formula injection — a leading
 * `=`, `+`, `-`, `@` (or a control char) makes Excel/Sheets execute the cell, so
 * we prefix such values with a single quote to force them to be read as text —
 * then applies RFC 4180 quoting when the value contains a quote, comma, or
 * newline (doubling any embedded quotes).
 */
export function escapeCsvField(value: string): string {
  const guarded = INJECTION_PREFIX.test(value) ? `'${value}` : value;
  if (!NEEDS_QUOTING.test(guarded)) return guarded;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function str(value: string | number | null | undefined): string {
  return value == null ? "" : String(value);
}

/** Owner display: name, falling back to email, then empty. */
function owner(name: string | null, email: string | null): string {
  return name?.trim() || email?.trim() || "";
}

/** Columns exported, in display order, each mapping a row to a cell value. */
const COLUMNS: { header: string; value: (r: WorkItemRow) => string }[] = [
  { header: "#", value: (r) => str(r.stack_rank) },
  { header: "Description", value: (r) => str(r.description) },
  { header: "Status", value: (r) => str(r.status_label) },
  { header: "PM", value: (r) => owner(r.pm_name, r.pm_email) },
  { header: "Tech Lead", value: (r) => owner(r.tech_lead_name, r.tech_lead_email) },
  { header: "SDM", value: (r) => owner(r.sdm_name, r.sdm_email) },
  { header: "Target date", value: (r) => str(r.target_date) },
  { header: "Date type", value: (r) => str(r.date_type) },
  { header: "Labels", value: (r) => (r.label_names ?? []).join("; ") },
  { header: "Latest update", value: (r) => str(r.latest_update) },
  { header: "Last activity", value: (r) => str(r.last_activity_at) },
];

/** Build a CSV document (header + one record per row) from work-item rows. */
export function buildItemsCsv(rows: WorkItemRow[]): string {
  const header = COLUMNS.map((c) => escapeCsvField(c.header)).join(",");
  const records = rows.map((r) =>
    COLUMNS.map((c) => escapeCsvField(c.value(r))).join(","),
  );
  return [header, ...records].join(ROW_SEP) + ROW_SEP;
}

/** Byte length of a CSV string once UTF-8 encoded (what the download weighs). */
export function csvByteSize(csv: string): number {
  return new TextEncoder().encode(csv).length;
}

/** Human-readable byte size for user-facing messages, e.g. "2.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
