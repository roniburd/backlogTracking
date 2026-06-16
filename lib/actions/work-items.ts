"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

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

/** Sync work_item_labels to exactly `labelIds`, inserting/removing the diff. */
async function syncLabels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workItemId: string,
  labelIds: string[],
) {
  const { data: existing } = await supabase
    .from("work_item_labels")
    .select("label_id")
    .eq("work_item_id", workItemId);

  const current = new Set((existing ?? []).map((r) => r.label_id));
  const next = new Set(labelIds);

  const toAdd = labelIds.filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !next.has(id));

  if (toAdd.length) {
    await supabase
      .from("work_item_labels")
      .insert(toAdd.map((label_id) => ({ work_item_id: workItemId, label_id })));
  }
  if (toRemove.length) {
    await supabase
      .from("work_item_labels")
      .delete()
      .eq("work_item_id", workItemId)
      .in("label_id", toRemove);
  }
}

export async function createWorkItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fields = parseFields(formData);
  if (!fields.description) return { error: "Description is required." };

  const supabase = await createClient();

  // New items go to the bottom of the stack rank unless one was provided.
  let stackRank = fields.stack_rank;
  if (stackRank === null) {
    const { data: top } = await supabase
      .from("work_items")
      .select("stack_rank")
      .order("stack_rank", { ascending: false })
      .limit(1)
      .maybeSingle();
    stackRank = (top?.stack_rank ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("work_items")
    .insert({ ...fields, stack_rank: stackRank })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const labels = formData.getAll("labels").map(String);
  if (labels.length) await syncLabels(supabase, data.id, labels);

  revalidatePath("/items");
  redirect(`/items/${data.id}`);
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

  await syncLabels(supabase, id, formData.getAll("labels").map(String));

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

/** Inline status change from the table view. */
export async function setWorkItemStatus(
  id: string,
  statusId: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ status_id: statusId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  return null;
}
