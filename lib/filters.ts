// Filter definition shared by the table filters bar and saved queries.
// Filters live in the URL (shareable) and a saved query simply stores this same
// flat object as JSON in saved_queries.definition.

import { staleCutoff } from "@/lib/stale";

export type Filters = {
  q: string; // free text over description
  statuses: string[]; // status ids
  pm: string; // pm_owner id
  tl: string; // tech_lead_owner id
  sdm: string; // sdm_owner id
  owner: string; // matches ANY of the three owner roles
  labels: string[]; // label ids
  from: string; // target_date >=
  to: string; // target_date <=
  stale: boolean; // last_activity_at older than STALE_DAYS ("needs an update")
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  statuses: [],
  pm: "",
  tl: "",
  sdm: "",
  owner: "",
  labels: [],
  from: "",
  to: "",
  stale: false,
};

type RawParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}
function csv(v: string | string[] | undefined): string[] {
  const s = str(v);
  return s ? s.split(",").filter(Boolean) : [];
}

/** Parse Next.js searchParams (or a saved definition) into Filters. */
export function parseFilters(sp: RawParams): Filters {
  return {
    q: str(sp.q),
    statuses: csv(sp.status),
    pm: str(sp.pm),
    tl: str(sp.tl),
    sdm: str(sp.sdm),
    owner: str(sp.owner),
    labels: csv(sp.label),
    from: str(sp.from),
    to: str(sp.to),
    stale: str(sp.stale) === "1",
  };
}

/** Flatten Filters back to URL/JSON params, omitting empty values. */
export function filtersToParams(f: Filters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.q) p.q = f.q;
  if (f.statuses.length) p.status = f.statuses.join(",");
  if (f.pm) p.pm = f.pm;
  if (f.tl) p.tl = f.tl;
  if (f.sdm) p.sdm = f.sdm;
  if (f.owner) p.owner = f.owner;
  if (f.labels.length) p.label = f.labels.join(",");
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  if (f.stale) p.stale = "1";
  return p;
}

export function hasActiveFilters(f: Filters): boolean {
  return Object.keys(filtersToParams(f)).length > 0;
}

/**
 * Apply filters to a supabase query over `work_items_view`.
 * Generic over the builder type so the caller keeps its typing.
 */
export function applyFilters<T extends FilterableQuery>(query: T, f: Filters): T {
  let q = query;
  if (f.q) q = q.ilike("description", `%${f.q}%`) as T;
  if (f.statuses.length) q = q.in("status_id", f.statuses) as T;
  if (f.pm) q = q.eq("pm_owner", f.pm) as T;
  if (f.tl) q = q.eq("tech_lead_owner", f.tl) as T;
  if (f.sdm) q = q.eq("sdm_owner", f.sdm) as T;
  if (f.owner) {
    q = q.or(
      `pm_owner.eq.${f.owner},tech_lead_owner.eq.${f.owner},sdm_owner.eq.${f.owner}`,
    ) as T;
  }
  if (f.labels.length) q = q.overlaps("label_ids", f.labels) as T;
  if (f.from) q = q.gte("target_date", f.from) as T;
  if (f.to) q = q.lte("target_date", f.to) as T;
  if (f.stale) q = q.lte("last_activity_at", staleCutoff()) as T;
  return q;
}

// Minimal structural type for the supabase PostgREST filter builder methods used above.
type FilterableQuery = {
  ilike(column: string, pattern: string): FilterableQuery;
  in(column: string, values: readonly string[]): FilterableQuery;
  eq(column: string, value: string): FilterableQuery;
  or(filters: string): FilterableQuery;
  overlaps(column: string, value: readonly string[]): FilterableQuery;
  gte(column: string, value: string): FilterableQuery;
  lte(column: string, value: string): FilterableQuery;
};
