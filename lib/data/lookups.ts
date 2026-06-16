import { createClient } from "@/lib/supabase/server";
import type { Label, Profile, Status } from "@/lib/db";

/** Shared dropdown data used by the work-item form and filters. */
export async function getLookups(): Promise<{
  statuses: Status[];
  labels: Label[];
  profiles: Profile[];
}> {
  const supabase = await createClient();
  const [statuses, labels, profiles] = await Promise.all([
    supabase.from("statuses").select("*").order("sort_order"),
    supabase.from("labels").select("*").order("name"),
    supabase.from("profiles").select("*").order("full_name"),
  ]);
  return {
    statuses: statuses.data ?? [],
    labels: labels.data ?? [],
    profiles: profiles.data ?? [],
  };
}
