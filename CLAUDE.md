# CLAUDE.md

Guidance for working in this repository. This is the short, always-loaded
version: how to run things and the engineering principles to hold to. Deeper
architectural reasoning, conventions, and the Supabase/Vercel patterns live in
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — read it before changing the
data layer, auth, rendering strategy, or deployment config.

## Stack

- **Next.js (App Router)** — Server Components by default, Server Actions for
  mutations, route handlers for APIs.
- **TypeScript** in strict mode.
- **Supabase** — Postgres, Auth, and Row Level Security.
- **Vercel** — hosting, preview deployments, environment management.
- **Tailwind + shadcn/ui** for styling and primitives.

## Commands

```bash
pnpm dev      # local dev server
pnpm build    # production build — must pass before a change is "done"
pnpm start    # serve the production build
pnpm lint     # eslint
pnpm test     # run the test suite
```

(Adjust the package manager to whatever the lockfile indicates.)

## Working principles

- **YAGNI.** Build what the current task needs, not what it might need later.
  Delete dead code rather than commenting it out.
- **Keep changes small and focused.** One concern per change. Don't bundle
  refactors with behavior changes — they're hard to review and to revert.
- **Match the surrounding code.** Mirror existing naming, file layout, and
  idioms before introducing new ones. Consistency beats personal preference.
- **Write tests for behavior you add or fix.** A bug fix gets a test that fails
  before and passes after. Test behavior and edges, not implementation details.
- **Make it correct, then clear, then fast.** Don't optimize without a measured
  reason; readability is the default priority.
- **Prefer the platform over a dependency — but don't reinvent a hard, solved
  wheel.** Reach for a new package only when the standard library / framework
  genuinely can't do it *and* the thing you'd otherwise write is small and fully
  in your control (a string helper, a bit of date math). The flip side matters
  just as much: when the need is a complex, well-solved, *no-customization*
  component — a date-picker calendar, a rich-text editor, drag-and-drop — a
  mature, battle-tested library is the **lower**-liability choice. Hand-rolling
  it means owning the accessibility, keyboard handling, i18n, and edge cases the
  library already got right, and getting them subtly wrong. The test: *is this a
  thin convenience I can write in a few tested lines (write it), or non-trivial
  behavior the ecosystem has already hardened (take the dep)?* Every dependency
  is still a long-term liability — choose deliberately, not by reflex in either
  direction.
- **Fail loudly.** Validate inputs at the boundary; don't swallow errors. Handle
  the error or propagate it — never silently `catch {}`.
- **Types are the contract.** No `any` as an escape hatch. Let inference work;
  annotate the boundaries (function signatures, exported values).

## Definition of done

A change is done when:

1. It does what was asked — no more (YAGNI), no less.
2. `pnpm build`, `pnpm lint`, and `pnpm test` all pass.
3. New/changed behavior has tests.
4. No secrets, keys, or `.env` values are committed.
5. The diff is self-explanatory; comments explain *why*, not *what*.

## Security baseline

- Never commit secrets. Server-only secrets must **not** use the public env
  prefix; only truly public values may be exposed to the browser.
- Enforce authorization in the database (RLS) and/or on the server — never trust
  the client. See `docs/ARCHITECTURE.md` for the auth and RLS model.
- Validate and sanitize all external input on the server side.

## Before you finish

- Re-read your own diff. Would it pass review?
- Run the build, lint, and tests — don't claim success without verifying.
- Update `docs/ARCHITECTURE.md` if you changed an architectural decision.
