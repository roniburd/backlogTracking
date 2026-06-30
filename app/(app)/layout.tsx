import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but re-check so `user` is non-null below.
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Friendly name, falling back to email so the nav is never blank.
  const name = me?.full_name?.trim() || user.email || "";

  return (
    <div className="min-h-dvh">
      <AppNav
        name={name}
        email={user.email ?? ""}
        isAdmin={me?.is_admin ?? false}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
