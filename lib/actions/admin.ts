"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AdminState = { error: string } | { ok: true } | null;

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/items");
  revalidatePath("/dashboard");
}

// ---- Statuses -------------------------------------------------------------

export async function createStatus(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const label = String(formData.get("label") ?? "").trim();
  const key =
    String(formData.get("key") ?? "").trim() ||
    label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!label || !key) return { error: "Label is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("statuses").insert({
    key,
    label,
    color: String(formData.get("color") ?? "gray"),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_attention: formData.get("is_attention") === "on",
    is_terminal: formData.get("is_terminal") === "on",
  });
  if (error) return { error: error.message };
  revalidateAdmin();
  return { ok: true };
}

export async function updateStatus(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("statuses")
    .update({
      label: String(formData.get("label") ?? "").trim(),
      color: String(formData.get("color") ?? "gray"),
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_attention: formData.get("is_attention") === "on",
      is_terminal: formData.get("is_terminal") === "on",
    })
    .eq("id", id);
  revalidateAdmin();
}

export async function deleteStatus(id: string) {
  const supabase = await createClient();
  await supabase.from("statuses").delete().eq("id", id);
  revalidateAdmin();
}

// ---- Labels ---------------------------------------------------------------

export async function createLabel(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("labels")
    .insert({ name, color: String(formData.get("color") ?? "gray") });
  if (error) return { error: error.message };
  revalidateAdmin();
  return { ok: true };
}

export async function deleteLabel(id: string) {
  const supabase = await createClient();
  await supabase.from("labels").delete().eq("id", id);
  revalidateAdmin();
}

// ---- Users ----------------------------------------------------------------

export async function setUserAdmin(targetUser: string, makeAdmin: boolean) {
  const supabase = await createClient();
  await supabase.rpc("set_user_admin", {
    target_user: targetUser,
    make_admin: makeAdmin,
  });
  revalidateAdmin();
}
