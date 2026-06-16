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
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
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
