"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validation";

export type ProfileState =
  | { ok: true; message: string }
  | { error: string }
  | null;

/**
 * Update the signed-in user's own friendly name and email.
 *
 * - The friendly name lives on `profiles.full_name`. RLS (and the column-scoped
 *   grant) restrict a user to updating only their own `full_name`, so this write
 *   goes through the user-scoped client, never `service_role`.
 * - Email is owned by Supabase Auth, not the profiles row, so an email change
 *   goes through `auth.updateUser`. The denormalized `profiles.email` copy is
 *   kept in sync by the `on_auth_user_email_changed` trigger once the change is
 *   confirmed.
 */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: "Email is required." };
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to update your profile." };

  // Store an empty name as NULL so the email-fallback display kicks in.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  let emailPending = false;
  if (email !== user.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) return { error: authError.message };
    emailPending = true;
  }

  // The friendly name appears in the nav, the items list, and item detail owner
  // columns; refresh the places that read it.
  revalidatePath("/profile");
  revalidatePath("/items");
  revalidatePath("/items/[id]", "page");

  return {
    ok: true,
    message: emailPending
      ? "Saved. Check your email to confirm the address change before it takes effect."
      : "Profile saved.",
  };
}
