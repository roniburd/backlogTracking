"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseISODate } from "@/lib/calendar";
import { isDateType, isOwnerField, type OwnerField } from "@/lib/inline-edit";
import { safeInternalPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { duplicateWorkItemFields } from "@/lib/work-items";

export type ActionState = { error: string } | null;

/** Stack rank that places a new item at the bottom of the current backlog. */
async function nextStackRank(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const { data: top } = await supabase
    .from("work_items")
    .select("stack_rank")
    .order("stack_rank", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (top?.stack_rank ?? 0) + 1;
}

/** Empty string -> null; used for optional uuid/date/text fields. */
function nullable(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function parseFields(formData: FormData) {
  const dateType = nullable(formData.get("date_type"));
  return {
    description: String(formData.get("description") ?? "").trim(),
    status_id: nullable(formData.get("status_id")),
    pm_owner: nullable(formData.get("pm_owner")),
    tech_lead_owner: nullable(formData.get("tech_lead_owner")),
    sdm_owner: nullable(formData.get("sdm_owner")),
    target_date: nullable(formData.get("target_date")),
    date_type: dateType as "DFD" | "ECD" | null,
    stack_rank: formData.get("stack_rank")
      ? Number(formData.get("stack_rank"))
      : null,
  };
}

/**
 * Sync work_item_labels to exactly `labelIds`, inserting/removing the diff.
 * Returns an error string if any write failed, so callers can fail loudly
 * instead of silently dropping a label change.
 */
async function syncLabels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workItemId: string,
  labelIds: string[],
): Promise<string | null> {
  const { data: existing, error: readError } = await supabase
    .from("work_item_labels")
    .select("label_id")
    .eq("work_item_id", workItemId);
  if (readError) return readError.message;

  const current = new Set((existing ?? []).map((r) => r.label_id));
  const next = new Set(labelIds);

  const toAdd = [...next].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !next.has(id));

  if (toAdd.length) {
    const { error } = await supabase
      .from("work_item_labels")
      .insert(toAdd.map((label_id) => ({ work_item_id: workItemId, label_id })));
    if (error) return error.message;
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("work_item_labels")
      .delete()
      .eq("work_item_id", workItemId)
      .in("label_id", toRemove);
    if (error) return error.message;
  }
  return null;
}

export async function createWorkItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseFields(formData);
  if (!fields.description) return { error: "Description is required." };

  const supabase = await createClient();

  // New items go to the bottom of the stack rank unless one was provided.
  const stackRank = fields.stack_rank ?? (await nextStackRank(supabase));

  const { data, error } = await supabase
    .from("work_items")
    .insert({ ...fields, stack_rank: stackRank })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const labels = formData.getAll("labels").map(String);
  if (labels.length) {
    const labelError = await syncLabels(supabase, data.id, labels);
    if (labelError) return { error: labelError };
  }

  // Return to where the user started (the table/search view they filtered),
  // falling back to the items list. `from` is untrusted, so validate it.
  const from = safeInternalPath(formData.get("from")?.toString(), "/items");

  revalidatePath("/items");
  redirect(from);
}

export async function updateWorkItem(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseFields(formData);
  if (!fields.description) return { error: "Description is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ ...fields, stack_rank: fields.stack_rank ?? 0 })
    .eq("id", id);

  if (error) return { error: error.message };

  const labelError = await syncLabels(
    supabase,
    id,
    formData.getAll("labels").map(String),
  );
  if (labelError) return { error: labelError };

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteWorkItem(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("work_items").delete().eq("id", id);
  revalidatePath("/items");
  redirect("/items");
}

/**
 * Duplicate a work item into a fresh copy that can be reused as a template.
 * The copy carries over the item's fields and labels but not its comments or
 * history (see `duplicateWorkItemFields`). Lands the user on the new item's
 * edit page so they can tweak it.
 */
export async function duplicateWorkItem(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: source, error: readError } = await supabase
    .from("work_items")
    .select(
      "description, status_id, pm_owner, tech_lead_owner, sdm_owner, target_date, date_type",
    )
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(`Failed to read item: ${readError.message}`);
  if (!source) throw new Error("Item not found.");

  const { data, error } = await supabase
    .from("work_items")
    .insert({
      ...duplicateWorkItemFields(source),
      stack_rank: await nextStackRank(supabase),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to duplicate item: ${error.message}`);

  // Carry over the labels; comments are intentionally not copied.
  const { data: sourceLabels } = await supabase
    .from("work_item_labels")
    .select("label_id")
    .eq("work_item_id", id);
  const labelIds = (sourceLabels ?? []).map((l) => l.label_id);
  if (labelIds.length) await syncLabels(supabase, data.id, labelIds);

  revalidatePath("/items");
  redirect(`/items/${data.id}`);
}

/** Inline status change from the table view. Empty string clears the status. */
export async function setWorkItemStatus(
  id: string,
  statusId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ status_id: statusId === "" ? null : statusId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  return null;
}

/**
 * Inline owner (PM / Tech Lead / SDM) change from the table view. `field` is
 * validated against an allowlist so an untrusted caller can only ever write one
 * of the owner columns — never an arbitrary column. Empty string clears it.
 */
export async function setWorkItemOwner(
  id: string,
  field: OwnerField,
  ownerId: string,
): Promise<ActionState> {
  if (!isOwnerField(field)) return { error: "Invalid field." };
  const value = ownerId === "" ? null : ownerId;
  // Explicit per-column update keeps the payload precisely typed (Supabase's
  // generated types reject a computed key) while `field` stays allowlisted.
  const update =
    field === "pm_owner"
      ? { pm_owner: value }
      : field === "tech_lead_owner"
        ? { tech_lead_owner: value }
        : { sdm_owner: value };

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update(update)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  return null;
}

/**
 * Inline description (title) change from the table view. The description is
 * required, so a blank value is rejected rather than written.
 */
export async function setWorkItemDescription(
  id: string,
  description: string,
): Promise<ActionState> {
  const trimmed = description.trim();
  if (trimmed === "") return { error: "Description is required." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ description: trimmed })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  return null;
}

/**
 * Inline target-date change from the table view. Both inputs are untrusted:
 * the date must be a real `YYYY-MM-DD` value and the type one of the allowed
 * codes, mirroring the DB constraints. An empty string clears either field.
 */
export async function setWorkItemDate(
  id: string,
  targetDate: string,
  dateType: string,
): Promise<ActionState> {
  const date = targetDate === "" ? null : targetDate;
  if (date !== null && !parseISODate(date)) return { error: "Invalid date." };
  const type = dateType === "" ? null : dateType;
  if (type !== null && !isDateType(type)) return { error: "Invalid date type." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ target_date: date, date_type: type })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  return null;
}

/** Inline label change from the table view: set the item's labels to `labelIds`. */
export async function setWorkItemLabels(
  id: string,
  labelIds: string[],
): Promise<ActionState> {
  const supabase = await createClient();
  const labelError = await syncLabels(supabase, id, [...new Set(labelIds)]);
  if (labelError) return { error: labelError };
  revalidatePath("/items");
  return null;
}
