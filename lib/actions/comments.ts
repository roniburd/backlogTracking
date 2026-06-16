"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CommentState = { error: string } | null;

/**
 * Add a comment / latest update to a work item. The DB trigger updates the
 * item's latest_update + last_comment_at and writes a 'comment' audit row.
 */
export async function addComment(
  workItemId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Comment can't be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("comments")
    .insert({ work_item_id: workItemId, body, author: user.id });

  if (error) return { error: error.message };

  revalidatePath(`/items/${workItemId}`);
  revalidatePath("/items");
  return null;
}
