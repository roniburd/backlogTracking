import type { Label } from "@/lib/db";

/**
 * The work-item owner columns that may be edited inline from the table. This is
 * an allowlist, not a convenience: the inline-edit Server Action writes the
 * column named by this field, so it must never accept an arbitrary, client-
 * supplied column name (which would let a caller write `created_by`, etc.).
 */
export const OWNER_FIELDS = [
  "pm_owner",
  "tech_lead_owner",
  "sdm_owner",
] as const;

export type OwnerField = (typeof OWNER_FIELDS)[number];

/** Narrow an untrusted string to one of the editable owner columns. */
export function isOwnerField(value: string): value is OwnerField {
  return (OWNER_FIELDS as readonly string[]).includes(value);
}

/**
 * The values the `work_items.date_type` column accepts (matching the DB check
 * constraint). Like {@link OWNER_FIELDS}, this is an allowlist the inline-edit
 * Server Action validates against so an untrusted caller can't write an
 * arbitrary type string.
 */
export const DATE_TYPES = ["DFD", "ECD"] as const;

export type DateType = (typeof DATE_TYPES)[number];

/** Narrow an untrusted string to a valid date type. */
export function isDateType(value: string): value is DateType {
  return (DATE_TYPES as readonly string[]).includes(value);
}

/**
 * Suggestions for the inline label editor's autocomplete. Returns labels whose
 * name contains `query` (case-insensitive), excluding ones already attached, in
 * the input order (the catalog is fetched sorted by name) and capped at `limit`.
 * An empty/whitespace query lists every not-yet-selected label.
 *
 * Selecting from the existing catalog is deliberate: the `labels` table is
 * admin-managed (RLS), so non-admins attach existing labels rather than minting
 * new ones from free text.
 */
export function filterLabelSuggestions(
  labels: Pick<Label, "id" | "name">[],
  query: string,
  selectedIds: Iterable<string>,
  limit = 8,
): Pick<Label, "id" | "name">[] {
  const selected = new Set(selectedIds);
  const q = query.trim().toLowerCase();
  const matches = labels.filter(
    (l) => !selected.has(l.id) && (q === "" || l.name.toLowerCase().includes(q)),
  );
  return limit >= 0 ? matches.slice(0, limit) : matches;
}
