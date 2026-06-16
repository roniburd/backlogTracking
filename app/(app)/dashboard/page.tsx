import Link from "next/link";

import { statusDot } from "@/lib/status-color";
import { createClient } from "@/lib/supabase/server";
import type { Status, WorkItemRow } from "@/lib/db";
import { cn } from "@/lib/utils";

const STALE_DAYS = 14;

function isStale(iso: string | null) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() > STALE_DAYS * 86_400_000;
}

function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ItemRow({ r }: { r: WorkItemRow }) {
  return (
    <li className="flex items-center gap-2 py-1 text-sm">
      <span className={cn("size-2 shrink-0 rounded-full", statusDot(r.status_color))} />
      <Link href={`/items/${r.id}`} className="flex-1 truncate hover:underline">
        {r.description}
      </Link>
      <span className="shrink-0 text-xs text-muted-foreground">
        {r.status_label ?? "—"}
      </span>
    </li>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user?.id ?? "";
  const ownerFilter = `pm_owner.eq.${me},tech_lead_owner.eq.${me},sdm_owner.eq.${me}`;

  const [{ data: mine }, { data: statuses }, { data: saved }] =
    await Promise.all([
      supabase
        .from("work_items_view")
        .select("*")
        .or(ownerFilter)
        .order("stack_rank"),
      supabase.from("statuses").select("*").order("sort_order"),
      supabase.from("saved_queries").select("*").order("name"),
    ]);

  const rows = (mine ?? []) as WorkItemRow[];
  const statusList = (statuses ?? []) as Status[];
  const attentionIds = statusList.filter((s) => s.is_attention).map((s) => s.id);

  const stale = rows.filter((r) => isStale(r.last_activity_at));
  const attention = rows.filter((r) => r.status_is_attention);
  const byStatus = statusList
    .map((s) => ({
      status: s,
      items: rows.filter((r) => r.status_id === s.id),
    }))
    .filter((g) => g.items.length > 0);

  const personal = (saved ?? []).filter((q) => q.scope === "personal");
  const team = (saved ?? []).filter((q) => q.scope === "team");

  const mineHref = `/items?owner=${me}`;
  const attentionHref =
    attentionIds.length > 0
      ? `/items?owner=${me}&status=${attentionIds.join(",")}`
      : mineHref;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} item{rows.length === 1 ? "" : "s"} you own ·{" "}
          {stale.length} need an update · {attention.length} blocked/at-risk
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={`Needs an update (>${STALE_DAYS} days)`} href={mineHref}>
          {stale.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Everything you own has recent activity. 🎉
            </p>
          ) : (
            <ul className="divide-y">
              {stale.map((r) => (
                <ItemRow key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Blocked or at risk" href={attentionHref}>
          {attention.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blocked or at-risk items. 👍
            </p>
          ) : (
            <ul className="divide-y">
              {attention.map((r) => (
                <ItemRow key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="My items by status" href={mineHref}>
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">You own no items yet.</p>
          ) : (
            <ul className="space-y-1">
              {byStatus.map(({ status, items }) => (
                <li key={status.id} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2 rounded-full", statusDot(status.color))} />
                  <Link
                    href={`/items?owner=${me}&status=${status.id}`}
                    className="flex-1 hover:underline"
                  >
                    {status.label}
                  </Link>
                  <span className="tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Saved views">
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Personal
              </p>
              {personal.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {personal.map((q) => (
                    <Link
                      key={q.id}
                      href={savedHref(q.definition)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                    >
                      {q.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Team
              </p>
              {team.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {team.map((q) => (
                    <Link
                      key={q.id}
                      href={savedHref(q.definition)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                    >
                      {q.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {rows.length > 0 && (
        <Card title="All my items" href={mineHref}>
          <ul className="divide-y">
            {rows.map((r) => (
              <ItemRow key={r.id} r={r} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function savedHref(def: unknown): string {
  const entries = Object.entries((def as Record<string, string>) ?? {});
  const qs = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `/items?${qs}` : "/items";
}
