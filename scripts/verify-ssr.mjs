// Verifies the @supabase/ssr cookie-session round-trip used by lib/supabase/server.ts:
// sign in (writes session cookies) -> fresh client reads those cookies -> getUser + RLS read.
import { createServerClient } from "@supabase/ssr";

const URL = "http://127.0.0.1:54421";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const jar = new Map();
const makeClient = () =>
  createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

// 1) Sign in — this should populate the cookie jar with the session.
const signInClient = makeClient();
const { error: signInErr } = await signInClient.auth.signInWithPassword({
  email: "dev@demo.local",
  password: "secret123",
});
if (signInErr) throw new Error("sign in failed: " + signInErr.message);
console.log("✓ signed in; cookies set:", [...jar.keys()].join(", "));

// 2) Fresh client reading only the jar cookies (simulates a new server request).
const requestClient = makeClient();
const {
  data: { user },
  error: userErr,
} = await requestClient.auth.getUser();
if (userErr || !user) throw new Error("getUser failed: " + (userErr?.message ?? "no user"));
console.log("✓ session restored from cookies for:", user.email);

// 3) RLS-scoped read through that session.
const { data, error: readErr } = await requestClient
  .from("statuses")
  .select("label")
  .order("sort_order");
if (readErr) throw new Error("read failed: " + readErr.message);
console.log(`✓ RLS read returned ${data.length} statuses:`, data.map((s) => s.label).join(", "));

console.log("\nSSR cookie-session path OK.");
