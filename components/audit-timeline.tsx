import type { AuditEntry } from "@/lib/db";

export type TimelineEntry = Pick<
  AuditEntry,
  "id" | "change_type" | "field_changed" | "old_value" | "new_value" | "changed_at"
> & { actor_name: string };

const FIELD_LABEL: Record<string, string> = {
  pm_owner: "PM",
  tech_lead_owner: "Tech Lead",
  sdm_owner: "SDM",
  stack_rank: "rank",
  target_date: "date",
  date_type: "date type",
  description: "description",
};

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describe(
  e: TimelineEntry,
  statusMap: Record<string, string>,
  profileMap: Record<string, string>,
): string {
  const status = (v: string | null) => (v ? (statusMap[v] ?? "—") : "—");
  const person = (v: string | null) => (v ? (profileMap[v] ?? "someone") : "Unassigned");

  switch (e.change_type) {
    case "create":
      return "created this item";
    case "delete":
      return "deleted this item";
    case "comment":
      return "posted an update";
    case "status_change":
      return `changed status from ${status(e.old_value)} to ${status(e.new_value)}`;
    case "label_change":
      return e.new_value
        ? `added label "${e.new_value}"`
        : `removed label "${e.old_value}"`;
    case "update":
    default: {
      const field = e.field_changed ?? "field";
      if (field === "description") return "edited the description";
      if (field === "pm_owner" || field === "tech_lead_owner" || field === "sdm_owner")
        return `changed ${FIELD_LABEL[field]} from ${person(e.old_value)} to ${person(e.new_value)}`;
      const label = FIELD_LABEL[field] ?? field;
      return `changed ${label} from ${e.old_value ?? "—"} to ${e.new_value ?? "—"}`;
    }
  }
}

export function AuditTimeline({
  entries,
  statusMap,
  profileMap,
}: {
  entries: TimelineEntry[];
  statusMap: Record<string, string>;
  profileMap: Record<string, string>;
}) {
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;

  return (
    <ol className="space-y-2 border-l pl-4">
      {entries.map((e) => (
        <li key={e.id} className="relative text-sm">
          <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-muted-foreground/40" />
          <span className="font-medium">{e.actor_name}</span>{" "}
          <span className="text-muted-foreground">
            {describe(e, statusMap, profileMap)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {when(e.changed_at)}
          </span>
        </li>
      ))}
    </ol>
  );
}
