import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InlineStatus } from "@/components/inline-status";
import { SortHeader } from "@/components/sort-header";
import type { Status, WorkItemRow } from "@/lib/db";

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

export function ItemsTable({
  rows,
  statuses,
}: {
  rows: WorkItemRow[];
  statuses: Status[];
}) {
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
                <InlineStatus
                  itemId={r.id!}
                  statusId={r.status_id}
                  color={r.status_color}
                  statuses={statuses}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.pm_name ?? r.pm_email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.tech_lead_name ?? r.tech_lead_email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.sdm_name ?? r.sdm_email ?? "—"}
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
                <div className="flex flex-wrap gap-1">
                  {(r.label_names ?? []).map((name) => (
                    <span
                      key={name}
                      className="rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
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
