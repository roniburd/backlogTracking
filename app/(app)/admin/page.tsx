import { redirect } from "next/navigation";

import { AdminClient } from "@/components/admin-client";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (!me?.is_admin) redirect("/dashboard");

  const [{ data: statuses }, { data: labels }, { data: users }, { data: saved }] =
    await Promise.all([
      supabase.from("statuses").select("*").order("sort_order"),
      supabase.from("labels").select("*").order("name"),
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("saved_queries").select("*").eq("scope", "team").order("name"),
    ]);

  return (
    <div className="space-y-5">
      <div className="pb-1">
        <h1 className="text-[22px] font-bold tracking-tight">Admin</h1>
        <div className="mt-2 h-[3px] w-8 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        <p className="mt-3 text-[13px] text-muted-foreground">
          Manage statuses, labels, users, and team views.
        </p>
      </div>
      <AdminClient
        statuses={statuses ?? []}
        labels={labels ?? []}
        users={users ?? []}
        teamQueries={saved ?? []}
        currentUserId={me.id}
      />
    </div>
  );
}
