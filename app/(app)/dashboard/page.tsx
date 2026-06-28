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

const ICON_TONE = {
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-primary/15 text-primary",
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-0.5 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
      {children}
    </h2>
  );
}

function Card({
  title,
  icon,
  tone = "violet",
  meta,
  href,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  tone?: keyof typeof ICON_TONE;
  meta?: React.ReactNode;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-white/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold">
          {icon && (
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-md text-[11px]",
                ICON_TONE[tone],
              )}
            >
              {icon}
            </span>
          )}
          {title}
          {meta && (
            <span className="text-[11px] font-normal text-muted-foreground">
              {meta}
            </span>
          )}
        </h3>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-[var(--primary-bright)]"
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
    <li className="flex items-center gap-2.5 py-2 text-[13px]">
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

function MetaChip({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="text-[13px] font-bold text-foreground tabular-nums">
        {n}
      </span>
      {label}
    </span>
  );
}

function EmptyState({
  emoji,
  children,
}: {
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="text-base">{emoji}</span>
      {children}
    </p>
  );
}

function SavedChip({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-input bg-secondary px-3 py-1 text-[13px] font-medium transition-colors hover:border-white/20"
    >
      {children}
    </Link>
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
    <div className="space-y-4">
      <div className="pb-2">
        <h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1>
        <div className="mt-2 h-[3px] w-8 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <MetaChip n={rows.length} label="items owned" />
          <MetaChip n={stale.length} label="need update" />
          <MetaChip n={attention.length} label="at risk" />
        </div>
      </div>

      <SectionLabel>Attention needed</SectionLabel>
      <div className="grid gap-3 md:grid-cols-2">
        <Card
          title="Needs an update"
          icon="⏱"
          tone="amber"
          meta={`>${STALE_DAYS} days`}
          href={mineHref}
        >
          {stale.length === 0 ? (
            <EmptyState emoji="🎉">
              Everything you own has recent activity.
            </EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-border">
              {stale.map((r) => (
                <ItemRow key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Blocked or at risk" icon="⛔" tone="red" href={attentionHref}>
          {attention.length === 0 ? (
            <EmptyState emoji="👍">No blocked or at-risk items.</EmptyState>
          ) : (
            <ul className="-my-1 divide-y divide-border">
              {attention.map((r) => (
                <ItemRow key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <SectionLabel>My work</SectionLabel>
      <Card title="Items by status" icon="◈" tone="blue" href={mineHref}>
        {byStatus.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            You don&apos;t own any items yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {byStatus.map(({ status, items }) => (
              <li
                key={status.id}
                className="flex items-center gap-2.5 text-[13px]"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    statusDot(status.color),
                  )}
                />
                <Link
                  href={`/items?owner=${me}&status=${status.id}`}
                  className="flex-1 font-medium hover:underline"
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

      {rows.length > 0 && (
        <Card title="All my items" icon="≡" tone="violet" href={mineHref}>
          <ul className="-my-1 divide-y divide-border">
            {rows.map((r) => (
              <ItemRow key={r.id} r={r} />
            ))}
          </ul>
        </Card>
      )}

      <SectionLabel>Saved views</SectionLabel>
      <Card title="Saved views" icon="★" tone="violet">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Personal
            </p>
            {personal.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                None yet — save a filtered view to pin it here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {personal.map((q) => (
                  <SavedChip key={q.id} href={savedHref(q.definition)}>
                    {q.name}
                  </SavedChip>
                ))}
              </div>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Team
            </p>
            {team.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">None yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {team.map((q) => (
                  <SavedChip key={q.id} href={savedHref(q.definition)}>
                    {q.name}
                  </SavedChip>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
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
