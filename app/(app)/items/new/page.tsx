import Link from "next/link";

import { WorkItemForm } from "@/components/work-item-form";
import { createWorkItem } from "@/lib/actions/work-items";
import { getLookups } from "@/lib/data/lookups";
import { safeInternalPath } from "@/lib/safe-redirect";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // The view the user came from, used both for Cancel and the post-save return.
  const from = safeInternalPath(
    typeof sp.from === "string" ? sp.from : undefined,
    "/items",
  );

  const { statuses, labels, profiles } = await getLookups();
  const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New work item</h1>
        <Link
          href={from}
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
        from={from}
      />
    </div>
  );
}
