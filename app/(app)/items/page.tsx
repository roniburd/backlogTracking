import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FiltersBar } from "@/components/filters-bar";
import { ItemsTable } from "@/components/items-table";
import { SavedQueryBar } from "@/components/saved-query-bar";
import { createClient } from "@/lib/supabase/server";
import { getLookups } from "@/lib/data/lookups";
import { applyFilters, filtersToParams, parseFilters } from "@/lib/filters";
import { resolveSort } from "@/lib/sort";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const { column, ascending } = resolveSort(
    typeof sp.sort === "string" ? sp.sort : undefined,
    typeof sp.dir === "string" ? sp.dir : undefined,
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("work_items_view")
    .select("*")
    .order(column, { ascending, nullsFirst: false });
  query = applyFilters(query, filters);

  const [{ data: rows }, lookups, { data: saved }, { data: profile }] =
    await Promise.all([
      query,
      getLookups(),
      supabase.from("saved_queries").select("*").order("name"),
      supabase
        .from("profiles")
        .select("id, is_admin")
        .eq("id", user?.id ?? "")
        .maybeSingle(),
    ]);

  const personal = (saved ?? []).filter((q) => q.scope === "personal");
  const team = (saved ?? []).filter((q) => q.scope === "team");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Work items</h1>
          <div className="mt-2 h-[3px] w-8 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        </div>
        <Button size="sm" render={<Link href="/items/new" />}>
          New item
        </Button>
      </div>

      <SavedQueryBar
        personal={personal}
        team={team}
        currentParams={filtersToParams(filters)}
        isAdmin={profile?.is_admin ?? false}
        currentUserId={profile?.id ?? ""}
      />

      <FiltersBar
        initial={filters}
        statuses={lookups.statuses}
        labels={lookups.labels}
        profiles={lookups.profiles}
      />

      <p className="text-sm text-muted-foreground">
        {rows?.length ?? 0} item{rows?.length === 1 ? "" : "s"}
      </p>

      {!rows?.length ? (
        <p className="text-sm text-muted-foreground">No items match.</p>
      ) : (
        <ItemsTable rows={rows} statuses={lookups.statuses} />
      )}
    </div>
  );
}
