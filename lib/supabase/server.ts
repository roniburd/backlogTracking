import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types";

/**
 * Request-scoped Supabase client used in Server Components and Server Actions.
 * It carries the signed-in user's JWT, so RLS and `auth.uid()` (relied on by our
 * audit triggers) work. Never swap this for the service_role key on user-initiated
 * writes — that bypasses RLS and produces NULL changed_by in the audit log.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // The middleware refreshes the session, so this can be ignored.
          }
        },
      },
    },
  );
}
