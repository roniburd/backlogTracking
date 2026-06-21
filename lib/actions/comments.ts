"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  // Redirect (303) instead of returning a value: the no-JS progressive-enhancement
  // path otherwise re-renders this authenticated page as the POST response, which
  // hangs (see siblings create/update/delete — they all redirect). On the JS path
  // this lands back on the same page with the new comment via the normal refresh.
  redirect(`/items/${workItemId}`);
}
