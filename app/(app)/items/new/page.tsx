import Link from "next/link";

import { WorkItemForm } from "@/components/work-item-form";
import { createWorkItem } from "@/lib/actions/work-items";
import { getLookups } from "@/lib/data/lookups";

export default async function NewItemPage() {
  const { statuses, labels, profiles } = await getLookups();
  const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New work item</h1>
        <Link
          href="/items"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
      <WorkItemForm
        action={createWorkItem}
        statuses={statuses}
        profiles={profiles}
        labels={labels}
        defaults={{ status_id: defaultStatus?.id ?? null }}
        submitLabel="Create item"
      />
    </div>
  );
}
