import type { Profile } from "@/lib/db";

/** Display name for a profile, falling back to email then a short id. */
export function profileName(p: Pick<Profile, "full_name" | "email" | "id">) {
  return p.full_name?.trim() || p.email?.trim() || p.id.slice(0, 8);
}

/**
 * Display label for a person referenced only by name + email — e.g. the owner
 * columns of `work_items_view`, which expose names and emails but no profile id.
 * Prefers the friendly name, falls back to the email, and finally to an em dash
 * when neither is set. A whitespace-only name is treated as absent.
 */
export function ownerLabel(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  return name?.trim() || email?.trim() || "—";
}

/**
 * Truncate `text` to at most `max` characters. Returns `text` unchanged when it
 * already fits; otherwise keeps the first `max - 1` characters and appends an
 * ellipsis so the result is exactly `max` characters long.
 */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
