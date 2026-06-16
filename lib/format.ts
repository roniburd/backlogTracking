import type { Profile } from "@/lib/db";

/** Display name for a profile, falling back to email then a short id. */
export function profileName(p: Pick<Profile, "full_name" | "email" | "id">) {
  return p.full_name || p.email || p.id.slice(0, 8);
}
