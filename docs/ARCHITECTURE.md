# Architecture

This document holds the *why* behind how the project is built — the decisions,
conventions, and patterns that aren't obvious from reading any single file.
`CLAUDE.md` is the quick reference; this is the reasoning. Keep it current: when
you make an architectural decision, record it here.

## Principles

- **Server-first.** Render and fetch on the server by default. Push interactivity
  to the client only where it's actually needed.
- **The database is the source of truth for authorization.** Application code can
  forget a check; a Row Level Security policy cannot be bypassed by a forgotten
  check. Defense in depth: enforce in the DB *and* validate on the server.
- **One way to do each thing.** Pick a single pattern for data fetching,
  mutations, error handling, and forms, and use it everywhere. Divergence is the
  main source of confusion in a codebase of this kind.
- **Explicit boundaries.** Client/server, public/private env, trusted/untrusted
  input — make each boundary visible in the code, not implicit.

## Directory layout

A conventional Next.js App Router layout:

```
app/                Routes. Folders are URL segments; route groups (parens)
                    organize without affecting the URL.
  layout.tsx        Shared shells (auth wrapper, nav, providers).
  <segment>/page.tsx
lib/                Non-UI logic: data access, server clients, helpers, types.
components/         Reusable UI. ui/ holds design-system primitives;
                    feature components compose them.
public/             Static assets served as-is.
```

Keep business logic out of components and route files. Components render; `lib/`
decides. This keeps logic testable without a DOM and routes thin.

## Rendering and data flow

- **Server Components** do data fetching directly — no client-side fetch waterfall
  for initial render. They run only on the server, so they can touch secrets and
  the database safely.
- **Client Components** (`"use client"`) are for interactivity: state, effects,
  event handlers, browser APIs. Keep them small and at the leaves of the tree;
  don't mark a whole page client just to make one button interactive.
- **Server Actions** (`"use server"`) are the standard mutation path. Forms post
  to actions; actions validate, write, and revalidate the affected paths/tags.
  Prefer them over hand-rolled API routes for app-internal mutations.
- **Route handlers** are for true HTTP endpoints (webhooks, third-party callbacks,
  public APIs) — not for internal form submissions.
- **Caching is a deliberate choice.** Know whether each fetch is static, dynamic,
  or revalidated, and make it explicit. Revalidate precisely after a mutation;
  don't blow away the whole cache.

## Auth and Row Level Security (Supabase)

The auth model rests on the request carrying the user's identity all the way to
the database, so RLS evaluates against the real user.

- **Three clients, three contexts.** A server client (Server Components / Actions,
  scoped to the request and the user's session via cookies), a browser client
  (Client Components), and session middleware that refreshes the auth token on
  each request. Use the right one for the context; don't share instances across
  requests.
- **RLS is mandatory on every table that holds user data.** A table without RLS
  policies is either fully open or fully closed — both are bugs. Write policies
  for select/insert/update/delete explicitly.
- **The user's JWT must reach the DB for writes.** RLS and any
  identity-dependent logic (e.g. `auth.uid()` in policies or triggers) only work
  when the request runs as the user. This is why user-initiated writes go through
  the user-scoped server client.
- **The `service_role` key bypasses RLS entirely.** It is a server-only secret,
  used only for trusted backend tasks (admin jobs, migrations, system processes)
  — **never** for user-initiated requests. Treating it as a convenience is how
  data leaks and authorization holes get introduced.

## Database changes (migrations)

- **All schema changes are migrations, checked into version control.** Never
  hand-edit a database out of band; the migration history is the schema's truth.
- Migrations are forward-only and immutable once shared — to change something,
  add a new migration rather than editing an old one.
- Regenerate the typed database schema after a migration so the TypeScript types
  match reality. Treat a type mismatch as a failing build.
- Test migrations against a local/branch database before they reach production.

## Environment and configuration

- `.env.local` holds local-dev values and is **never** committed. `.env.example`
  documents the required keys with safe placeholder values and **is** committed.
- **Public vs. secret is a hard line.** Only values safe to ship to the browser
  may carry the public env prefix; everything else is server-only. When in doubt,
  it's a secret.
- Read config from the environment, not hardcoded constants. Keep prod, preview,
  and local values in their respective places (local file vs. hosting provider).

## Deployment (Vercel)

- **Every push gets a preview deployment.** Treat preview URLs as the place to
  verify a change end-to-end before it's promoted. Production should only ever
  receive code that passed on a preview.
- **Production deploys are smoke-checked.** After `deploy-prod.yml` deploys, it
  polls the new deployment's `/api/health` endpoint (which round-trips to
  Postgres) before the job is allowed to go green. A failed check fails the job
  to alert you; it does not roll back (expand/contract migrations keep the prior
  code working in the meantime).
- **Environment variables are managed per environment** (production / preview /
  development) in the hosting provider, mirrored locally via the provider's CLI
  or `.env.local`. Changing an env var is a deploy-time concern — a running
  deployment won't pick it up retroactively.
- **The build must be reproducible.** It should pass from a clean checkout with
  only committed files plus configured env vars. If it needs an un-committed file
  or manual step, that's a bug to fix, not a step to document.
- Keep build output small and fast: ship only what the route needs, lean on the
  framework's image/font/asset optimization rather than rolling your own.

## Error handling and observability

- Handle errors at the boundary where you can do something useful; otherwise let
  them propagate. Don't catch-and-ignore.
- Surface user-facing failures as clear, recoverable UI states — not blank
  screens or raw stack traces.
- Log enough context to diagnose an issue without logging secrets or personal
  data.

## Testing

- **Unit-test the logic in `lib/`** — it's pure and fast to test, which is the
  payoff for keeping logic out of components.
- **Test behavior, not implementation.** A test should survive a refactor that
  preserves behavior.
- **A bug fix comes with a regression test** that fails before the fix and passes
  after.
- Cover the boundaries: auth/authorization rules, input validation, and the
  edges (empty, null, max, malformed) — that's where defects concentrate.

## Adding to this document

Record a decision here when it (a) constrains future work, (b) wasn't obvious, or
(c) someone could reasonably undo by accident. Keep entries about *why* and
*what rule to follow* — not a changelog of every edit.
