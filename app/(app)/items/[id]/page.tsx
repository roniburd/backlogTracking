import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AuditTimeline, type TimelineEntry } from "@/components/audit-timeline";
import { CommentThread, type ThreadComment } from "@/components/comment-thread";
import { WorkItemForm } from "@/components/work-item-form";
import { deleteWorkItem, updateWorkItem } from "@/lib/actions/work-items";
import { getLookups } from "@/lib/data/lookups";
import { profileName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: item },
    { data: itemLabels },
    { data: comments },
    { data: audit },
    lookups,
  ] = await Promise.all([
    supabase.from("work_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("work_item_labels").select("label_id").eq("work_item_id", id),
    supabase
      .from("comments")
      .select("id, body, created_at, author")
      .eq("work_item_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_log")
      .select("id, change_type, field_changed, old_value, new_value, changed_at, changed_by")
      .eq("item_id", id)
      .order("changed_at", { ascending: false })
      .order("id", { ascending: false }),
    getLookups(),
  ]);

  if (!item) notFound();

  const profileMap: Record<string, string> = Object.fromEntries(
    lookups.profiles.map((p) => [p.id, profileName(p)]),
  );
  const statusMap: Record<string, string> = Object.fromEntries(
    lookups.statuses.map((s) => [s.id, s.label]),
  );

  const threadComments: ThreadComment[] = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_name: c.author ? (profileMap[c.author] ?? "Unknown") : "Unknown",
  }));

  const timeline: TimelineEntry[] = (audit ?? []).map((a) => ({
    id: a.id,
    change_type: a.change_type,
    field_changed: a.field_changed,
    old_value: a.old_value,
    new_value: a.new_value,
    changed_at: a.changed_at,
    actor_name: a.changed_by ? (profileMap[a.changed_by] ?? "Unknown") : "System",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit work item</h1>
        <Link
          href="/items"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to items
        </Link>
      </div>

      <WorkItemForm
        action={updateWorkItem.bind(null, id)}
        statuses={lookups.statuses}
        profiles={lookups.profiles}
        labels={lookups.labels}
        defaults={{
          description: item.description,
          status_id: item.status_id,
          pm_owner: item.pm_owner,
          tech_lead_owner: item.tech_lead_owner,
          sdm_owner: item.sdm_owner,
          target_date: item.target_date,
          date_type: item.date_type,
          stack_rank: item.stack_rank,
          labelIds: (itemLabels ?? []).map((l) => l.label_id),
        }}
        submitLabel="Save changes"
      />

      <div className="grid gap-8 border-t pt-6 md:grid-cols-2">
        <CommentThread workItemId={id} comments={threadComments} />
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <AuditTimeline
            entries={timeline}
            statusMap={statusMap}
            profileMap={profileMap}
          />
        </section>
      </div>

      <div className="border-t pt-4">
        <form action={deleteWorkItem.bind(null, id)}>
          <Button type="submit" variant="destructive" size="sm">
            Delete item
          </Button>
        </form>
      </div>
    </div>
  );
}
