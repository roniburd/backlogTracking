// Guards a user-supplied "return to" target against open redirects.
// A `from` value can arrive from the URL or a posted form, so it is untrusted:
// only same-origin, relative paths are allowed. Anything that could send the
// browser off-site (absolute URLs, protocol-relative `//`, backslash tricks)
// falls back to a known-safe internal path.

export function safeInternalPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();

  // Must be a root-relative path.
  if (!value.startsWith("/")) return fallback;
  // Reject protocol-relative ("//host") and backslash variants browsers
  // normalize to slashes ("/\\host", "\\/host") — both escape the origin.
  if (value.startsWith("//") || value.startsWith("/\\") || value.startsWith("\\"))
    return fallback;
  // Reject control characters/whitespace that can break out of the path.
  if (/[\x00-\x1f\x7f\s]/.test(value)) return fallback;

  return value;
}
