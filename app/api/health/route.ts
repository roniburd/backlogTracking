import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Always run on the server at request time — a health check that could be
// cached or statically rendered would defeat its purpose.
export const dynamic = "force-dynamic";

/**
 * Production smoke-check endpoint, hit by `deploy-prod.yml` after a deploy.
 * A `head` query against `statuses` round-trips through PostgREST to Postgres:
 * it succeeds (RLS merely filters rows for an anon caller — that is not an
 * error) only if the env vars are present, Supabase is reachable, and the
 * table exists in the schema cache, i.e. migrations have applied. Any failure
 * surfaces as a 503 so the deploy job can go red.
 */
export async function GET() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("statuses")
    .select("id", { head: true, count: "exact" });

  if (error) {
    return NextResponse.json(
      { status: "error", db: "down", message: error.message },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "ok", db: "up" });
}
