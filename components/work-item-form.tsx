"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileName } from "@/lib/format";
import type { ActionState } from "@/lib/actions/work-items";
import type { Label as LabelRow, Profile, Status } from "@/lib/db";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export type WorkItemDefaults = {
  description?: string;
  status_id?: string | null;
  pm_owner?: string | null;
  tech_lead_owner?: string | null;
  sdm_owner?: string | null;
  target_date?: string | null;
  date_type?: string | null;
  stack_rank?: number | null;
  labelIds?: string[];
};

function OwnerSelect({
  name,
  label,
  profiles,
  defaultValue,
}: {
  name: string;
  label: string;
  profiles: Profile[];
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className={selectClass}
      >
        <option value="">Unassigned</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {profileName(p)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WorkItemForm({
  action,
  statuses,
  profiles,
  labels,
  defaults = {},
  submitLabel = "Save",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  statuses: Status[];
  profiles: Profile[];
  labels: LabelRow[];
  defaults?: WorkItemDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );
  const selectedLabels = new Set(defaults.labelIds ?? []);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={3}
          defaultValue={defaults.description ?? ""}
          placeholder="What needs to be done?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status_id">Status</Label>
          <select
            id="status_id"
            name="status_id"
            defaultValue={defaults.status_id ?? ""}
            className={selectClass}
          >
            <option value="">No status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stack_rank">Stack rank</Label>
          <Input
            id="stack_rank"
            name="stack_rank"
            type="number"
            step="any"
            defaultValue={defaults.stack_rank ?? ""}
            placeholder="Auto (bottom)"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <OwnerSelect
          name="pm_owner"
          label="PM"
          profiles={profiles}
          defaultValue={defaults.pm_owner}
        />
        <OwnerSelect
          name="tech_lead_owner"
          label="Tech Lead"
          profiles={profiles}
          defaultValue={defaults.tech_lead_owner}
        />
        <OwnerSelect
          name="sdm_owner"
          label="SDM"
          profiles={profiles}
          defaultValue={defaults.sdm_owner}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="target_date">Target date</Label>
          <DatePicker
            id="target_date"
            name="target_date"
            defaultValue={defaults.target_date}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_type">Date type</Label>
          <select
            id="date_type"
            name="date_type"
            defaultValue={defaults.date_type ?? ""}
            className={selectClass}
          >
            <option value="">—</option>
            <option value="DFD">DFD</option>
            <option value="ECD">ECD</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Labels</Label>
        <div className="flex flex-wrap gap-2">
          {labels.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No labels yet — add them in Admin.
            </span>
          )}
          {labels.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm has-checked:border-foreground has-checked:bg-muted"
            >
              <input
                type="checkbox"
                name="labels"
                value={l.id}
                defaultChecked={selectedLabels.has(l.id)}
                className="sr-only"
              />
              {l.name}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
