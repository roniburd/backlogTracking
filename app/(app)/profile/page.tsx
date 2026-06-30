import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but re-check so `user` is non-null below.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Update the name shown across the workspace and your sign-in email.
        </p>
      </div>
      <ProfileForm
        defaultName={profile?.full_name ?? ""}
        defaultEmail={user.email ?? ""}
      />
    </div>
  );
}
