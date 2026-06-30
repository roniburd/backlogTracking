import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InlineLabels } from "@/components/inline-labels";
import { InlineSelect, type InlineOption } from "@/components/inline-select";
import { SortHeader } from "@/components/sort-header";
import { profileName } from "@/lib/format";
import type { Label, Profile, Status, WorkItemRow } from "@/lib/db";
import type { OwnerField } from "@/lib/inline-edit";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeDays(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  if (days < 28) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** Zip the view's parallel label_ids/label_names arrays back into objects. */
function rowLabels(r: WorkItemRow): Pick<Label, "id" | "name">[] {
  const ids = r.label_ids ?? [];
  const names = r.label_names ?? [];
  return ids.map((id, i) => ({ id, name: names[i] ?? id }));
}

export function ItemsTable({
  rows,
  statuses,
  profiles,
  labels,
}: {
  rows: WorkItemRow[];
  statuses: Status[];
  profiles: Profile[];
  labels: Label[];
}) {
  const statusOptions: InlineOption[] = statuses.map((s) => ({
    value: s.id,
    label: s.label,
    color: s.color,
  }));
  const ownerOptions: InlineOption[] = profiles.map((p) => ({
    value: p.id,
    label: profileName(p),
  }));

  const ownerCell = (r: WorkItemRow, field: OwnerField) => (
    <InlineSelect
      itemId={r.id!}
      field={field}
      value={r[field] ?? ""}
      options={ownerOptions}
      placeholder="Unassigned"
      ariaLabel={field}
    />
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <SortHeader sortKey="rank" label="#" />
            </TableHead>
            <TableHead className="min-w-[16rem]">
              <SortHeader sortKey="description" label="Description" />
            </TableHead>
            <TableHead className="w-44">
              <SortHeader sortKey="status" label="Status" />
            </TableHead>
            <TableHead className="w-28">
              <SortHeader sortKey="pm" label="PM" />
            </TableHead>
            <TableHead className="w-28">Tech Lead</TableHead>
            <TableHead className="w-28">SDM</TableHead>
            <TableHead className="w-28">
              <SortHeader sortKey="target" label="Date" />
            </TableHead>
            <TableHead className="w-32">Labels</TableHead>
            <TableHead className="w-28">
              <SortHeader sortKey="activity" label="Last activity" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {r.stack_rank}
              </TableCell>
              <TableCell>
                <Link
                  href={`/items/${r.id}`}
                  className="font-medium hover:underline"
                >
                  {r.description}
                </Link>
                {r.latest_update && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.latest_update}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <InlineSelect
                  itemId={r.id!}
                  field="status"
                  value={r.status_id ?? ""}
                  options={statusOptions}
                  placeholder="No status"
                  ariaLabel="Status"
                  color={r.status_color}
                  showDot
                />
              </TableCell>
              <TableCell title={r.pm_email ?? undefined}>
                {ownerCell(r, "pm_owner")}
              </TableCell>
              <TableCell title={r.tech_lead_email ?? undefined}>
                {ownerCell(r, "tech_lead_owner")}
              </TableCell>
              <TableCell title={r.sdm_email ?? undefined}>
                {ownerCell(r, "sdm_owner")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.target_date ? (
                  <span>
                    {fmtDate(r.target_date)}
                    {r.date_type && (
                      <span className="ml-1 text-xs">({r.date_type})</span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <InlineLabels
                  itemId={r.id!}
                  selected={rowLabels(r)}
                  catalog={labels}
                />
              </TableCell>
              <TableCell
                className="text-xs text-muted-foreground"
                title={r.last_activity_at ?? undefined}
              >
                {relativeDays(r.last_activity_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
