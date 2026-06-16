"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";

export type SaveState = { error: string } | { ok: true } | null;

/** Persist the current filter params as a personal or team saved query. */
export async function createSavedQuery(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const name = String(formData.get("name") ?? "").trim();
  const scope = String(formData.get("scope") ?? "personal");
  const definitionRaw = String(formData.get("definition") ?? "{}");

  if (!name) return { error: "Name is required." };
  if (scope !== "personal" && scope !== "team")
    return { error: "Invalid scope." };

  let definition: unknown;
  try {
    definition = JSON.parse(definitionRaw);
  } catch {
    return { error: "Invalid filter definition." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("saved_queries")
    .insert({ name, scope, definition: definition as Json, owner: user.id });

  // RLS blocks non-admins from creating team queries.
  if (error) return { error: error.message };

  revalidatePath("/items");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteSavedQuery(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("saved_queries").delete().eq("id", id);
  revalidatePath("/items");
  revalidatePath("/dashboard");
}
