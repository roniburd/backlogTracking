// Signs in as a given user and prints a Cookie header for the @supabase/ssr
// session, so the running Next dev server can be exercised as that user.
// Usage: node scripts/get-cookie.mjs [email]
import { createServerClient } from "@supabase/ssr";

const URL = "http://127.0.0.1:54421";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const email = process.argv[2] || "dev@demo.local";
const jar = new Map();
const client = createServerClient(URL, ANON, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (toSet) => toSet.forEach(({ name, value }) => jar.set(name, value)),
  },
});

const { error } = await client.auth.signInWithPassword({ email, password: "secret123" });
if (error) {
  console.error("sign in failed:", error.message);
  process.exit(1);
}
process.stdout.write([...jar.entries()].map(([n, v]) => `${n}=${v}`).join("; "));
