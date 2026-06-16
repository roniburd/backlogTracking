#!/usr/bin/env bash
# Recreate local dev users after `supabase db reset` (which wipes auth.users).
# Usage: ./scripts/seed-users.sh
# Creates admin@demo.local (admin) and dev@demo.local (member), password: secret123
set -euo pipefail

API="${SUPABASE_API_URL:-http://127.0.0.1:54421}"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_backlogTracking}"

signup() {
  curl -s -X POST "$API/auth/v1/signup" -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"secret123\",\"data\":{\"full_name\":\"$2\"}}" -o /dev/null \
    -w "  $1 -> %{http_code}\n"
}

echo "Creating users..."
signup "admin@demo.local" "Ada Admin"
signup "dev@demo.local" "Dev Member"

echo "Promoting admin@demo.local to admin..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres \
  -c "update public.profiles set is_admin = true where email = 'admin@demo.local';"

echo "Done. Sign in with secret123."
