/** Sortable table columns mapped to columns on `work_items_view`. */
export const SORT_COLUMNS = {
  rank: "stack_rank",
  description: "description",
  status: "status_sort_order",
  pm: "pm_name",
  target: "target_date",
  activity: "last_activity_at",
  updated: "updated_at",
} as const;

export type SortKey = keyof typeof SORT_COLUMNS;

export const DEFAULT_SORT: SortKey = "rank";

export function resolveSort(sort?: string, dir?: string) {
  const key = (sort && sort in SORT_COLUMNS ? sort : DEFAULT_SORT) as SortKey;
  const ascending = dir !== "desc";
  return { key, column: SORT_COLUMNS[key], ascending };
}
