/**
 * Minimal, conservative email shape check for server-side boundary validation.
 * It rejects obvious garbage (empty, no `@`, no dot in the domain, whitespace)
 * so we fail loudly before calling out to Supabase Auth, which remains the
 * authoritative validator and deliverability check.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
