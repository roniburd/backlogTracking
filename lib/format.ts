import type { Profile } from "@/lib/db";

/** Display name for a profile, falling back to email then a short id. */
export function profileName(p: Pick<Profile, "full_name" | "email" | "id">) {
  return p.full_name?.trim() || p.email?.trim() || p.id.slice(0, 8);
}

/**
 * Truncate `text` to at most `max` characters. Returns `text` unchanged when it
 * already fits; otherwise keeps the first `max - 1` characters and appends an
 * ellipsis so the result is exactly `max` characters long.
 */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
