import type { WorkItem } from "@/lib/db";

/** Columns carried over when duplicating a work item into a fresh copy. */
export type DuplicableWorkItemFields = Pick<
  WorkItem,
  | "description"
  | "status_id"
  | "pm_owner"
  | "tech_lead_owner"
  | "sdm_owner"
  | "target_date"
  | "date_type"
>;

/**
 * Build the insert payload for duplicating a work item so it can be reused as a
 * template. It carries over the descriptive and ownership fields but deliberately
 * drops everything tied to the original's history: comments, the denormalized
 * `latest_update`/`last_comment_at`, the audit trail, and identity/timestamp
 * columns (all re-established by triggers on insert). Stack rank is not copied
 * either — the caller assigns a fresh rank so the duplicate lands at the bottom.
 * The description is prefixed with "Copy of " so the duplicate is distinguishable
 * from its source in the list view until the user renames it.
 */
export function duplicateWorkItemFields(
  source: DuplicableWorkItemFields,
): DuplicableWorkItemFields {
  return {
    description: `Copy of ${source.description}`,
    status_id: source.status_id,
    pm_owner: source.pm_owner,
    tech_lead_owner: source.tech_lead_owner,
    sdm_owner: source.sdm_owner,
    target_date: source.target_date,
    date_type: source.date_type,
  };
}
