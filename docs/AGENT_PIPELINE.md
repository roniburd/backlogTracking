# Autonomous Agent Pipeline

How a feature goes from a phone message to production, with two AI agents
(implementer + reviewer) iterating until they agree, then a human gate, then a
deterministic deploy.

This document is the *why* and the operator runbook. The actual prompts live in
`prompts/`, the reviewer persona in `.claude/agents/pr-reviewer.md`, and the
automation in `.github/workflows/`.

## The pipeline at a glance

```
                 ┌─────────────────────────────────────────────┐
  phone / mobile │ 1. INTAKE                                     │
  ──────────────▶│   a) Claude mobile app → cloud Code session  │
                 │   b) GitHub issue "@claude ..." → Action      │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │ 2. IMPLEMENT ↔ REVIEW LOOP (one session)     │
                 │   implementer writes code on a feature branch │
                 │   └▶ calls pr-reviewer SUBAGENT (fresh ctx)   │
                 │      ◀ structured verdict (PASS / CHANGES)    │
                 │   loop until: reviewer PASS  AND              │
                 │               build+lint+test green           │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │ 3. OPEN PR with the human summary            │
                 │   - what changed + why                        │
                 │   - alternatives considered & rejected        │
                 │   - .md/assumption changes flagged            │
                 │   - migrations listed                         │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │ 4. CI gate (.github/workflows/ci.yml)        │
                 │   build · lint · test · type-check on the PR  │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │ 5. HUMAN GATE  (you)                          │
                 │   branch protection on main REQUIRES your     │
                 │   approving review before merge               │
                 └───────────────────┬─────────────────────────┘
                                     ▼
                 ┌─────────────────────────────────────────────┐
                 │ 6. DEPLOY ON MERGE (deploy-prod.yml)         │
                 │   gated by "production" Environment           │
                 │   a) supabase db push   (migrations FIRST)    │
                 │   b) vercel deploy --prod (code SECOND)       │
                 │   c) smoke-check /api/health (alert-only)     │
                 └─────────────────────────────────────────────┘
```

## The one decision everything hangs off: loop topology

**The naive design — workflow A opens a PR, workflow B reviews and "requests
changes," which re-triggers workflow A — does not work.** GitHub deliberately
will not re-trigger a workflow from an event created by the default
`GITHUB_TOKEN` (an infinite-loop guard). Two event-driven workflows pinging each
other is also where runaway loops and cost surprises live.

So the implement↔review loop is **one orchestrated session**, not two workflows:

- The **implementer** runs the loop internally. After each change it invokes the
  **`pr-reviewer` subagent**, which starts with a *fresh context* — it sees the
  diff, not the implementer's reasoning, so it is a genuinely independent second
  opinion (this is what "have another agent act as reviewer" means in practice).
- The loop exits only when the reviewer returns **PASS** *and* `build`, `lint`,
  `test` are all green. Only then is the PR opened, with the summary already
  written.
- `claude-code-action` is reserved for the **interactive `@claude` intake**
  (mobile app / GitHub issues) — not for the review ping-pong.

This satisfies "iterate until both agree" with two real perspectives, fits the
self-hosted single-job model, and avoids the trigger trap.

## Migration vs. deploy ordering (the part most likely to bite)

Vercel's Git integration auto-deploys `main` on merge, *independently* of any
migration step. That is a race: new code can go live before its migration runs.

**Resolution, enforced by `deploy-prod.yml`:**

1. **Turn OFF Vercel's automatic *production* Git deploys** (keep preview
   deploys for PRs — they're how you verify). Production is deployed *only* by
   the workflow, so ordering is deterministic.
2. On merge to `main`, the workflow runs, gated behind a `production` GitHub
   Environment that **requires your approval**:
   1. `supabase db push` — migrations apply first.
   2. on success, `vercel build --prod` + `vercel deploy --prebuilt --prod` —
      code goes live second.
3. The `pr-reviewer` enforces **expand/contract (backward-compatible)
   migrations** so that even within the window, old code tolerates the new
   schema. Destructive changes (drop column/table) must ship in a *later* PR,
   after the code that depended on them is gone.
4. After the deploy, the workflow **smoke-checks the deployment URL** by polling
   `/api/health` (a route that round-trips to Postgres) with backoff. `vercel
   deploy` exiting 0 only means the deployment was *created* — the smoke check is
   what proves the live app actually serves against the just-migrated schema. A
   non-200 fails the job so the red run alerts you. This is **alert-only**: there
   is no automated rollback, which is safe precisely because of the
   expand/contract rule above — the previous code keeps working against the new
   schema while you decide what to do.

## What enforces the human gate

Branch protection on `main` with **"Require a pull request before merging" +
"Require approvals (1)" + "Require status checks (ci)"**. Without this, nothing
stops the agents from self-merging. This rule *is* "final review and check-in."

## The two requirements that vanish unless a prompt owns them

- **"alternatives discussed"** — the implementer keeps a running design-decision
  log as it works and folds it into the PR body. See `prompts/implementer.md`.
- **".md changes that broke assumptions"** — an explicit step diffs `CLAUDE.md`
  and `docs/*.md` on the branch and flags any change to a stated project
  assumption in the summary. Also in `prompts/implementer.md`.

---

## Operator runbook (the parts only you can do)

These cannot live in files — do them once in the GitHub/Vercel/Supabase UIs or
via CLI.

### 1. Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret | Used by | Notes |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | `claude-intake.yml` | **Claude Pro/Max subscription auth** — generate with `claude setup-token` locally, no API key needed. Agent runs consume your subscription usage limits. (Alternative: `anthropic_api_key` if you ever want pay-per-use.) |
| `GH_PAT` | `claude-intake.yml` | **fine-grained PAT or GitHub App token** with `contents:write` + `pull-requests:write`. Required so PRs the agent opens trigger `ci.yml` — the default `GITHUB_TOKEN` will NOT trigger it. |
| `SUPABASE_ACCESS_TOKEN` | `deploy-prod.yml` | personal access token for the Supabase CLI |
| `SUPABASE_DB_PASSWORD` | `deploy-prod.yml` | prod DB password for `db push` |
| `VERCEL_TOKEN` | `deploy-prod.yml` | scoped token |

Repository **variables** (not secrets) — Settings → Secrets and variables →
Actions → Variables tab:

| Variable | Used by | Value |
| --- | --- | --- |
| `SUPABASE_PROJECT_REF` | `deploy-prod.yml` | `xwqpvastboyxykgovcsd` |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | `deploy-prod.yml` | from `.vercel/project.json` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ci.yml` build | Next.js reads these at build time; a clean CI checkout has none. |

Put the deploy secrets in a **GitHub Environment named `production`** (not repo-
wide) and set **"Required reviewers" = you** on that environment. That is the
approval gate before any prod migration runs.

### 2. Branch protection (GitHub → Settings → Branches → add rule for `main`)

- Require a pull request before merging → Require approvals: **1**.
- Require status checks to pass → select **`ci`**.
- Require conversation resolution before merging.
- Do **not** allow bypassing the above (so agents can't self-merge).

### 3. Vercel

- Project → Settings → Git → **disable automatic production deployments**
  (keep preview deployments on). Production is driven by `deploy-prod.yml`.

### 4. Self-hosted runner (your chosen compute)

GitHub → Settings → Actions → Runners → New self-hosted runner. Follow the
register script on the box that will run the agents. Then the loop job targets
`runs-on: self-hosted`. Ensure `pnpm`, the Supabase CLI, the Vercel CLI, and the
Claude Code CLI are installed on that host. If you'd rather not maintain a host,
swap `runs-on: self-hosted` → `runs-on: ubuntu-latest` and add a setup step for
each tool — everything else is identical.

### 5. Test runner

`vitest` is wired up (`vitest.config.ts`, `pnpm test`). Run `pnpm install` once
to pull it in. The reviewer enforcing "has all the tests" is vacuous without
this, so it is part of the pipeline, not optional.

---

### 6. First-run verification (the workflows are authored, not yet run)

The test scaffolding is verified locally; the workflows are not — they can only
run with real secrets. On the first `@claude` issue, confirm these, in order:

1. **`pnpm build` passes in CI** with the `NEXT_PUBLIC_*` variables set (the one
   gate not runnable locally without prod env).
2. **The agent's PR triggers `ci.yml`** — if the check is missing, `GH_PAT` is
   wrong/absent and you're hitting the trigger guard.
3. **`claude-code-action` honors `prompt` alongside `trigger_phrase`.** If the
   agent gives a generic reply instead of running `prompts/implementer.md`,
   interactive mode is ignoring `prompt`; move the instructions into the comment
   template or switch that job to automation mode.
4. **The `pr-reviewer` subagent actually spawns** (look for a Task/subagent step
   in the run). If it doesn't, the reviewer collapses into the implementer's
   context and you lose the independent second opinion — run the reviewer as a
   separate step/job instead.

Items 3–4 depend on the Action's runtime and are the most likely first-run
surprises; the design degrades gracefully (you still get a PR + human gate).

## How you actually use it, day to day

1. **From your phone:** open the Claude app on the repo and describe the feature
   ("Add CSV export to the backlog table, behind a feature flag"), *or* open a
   GitHub issue and write `@claude implement: ...`.
2. The implementer branches, builds, and loops with the reviewer until both pass.
3. You get a PR with a plain-language summary, the alternatives it weighed, and
   any assumption/.md changes called out.
4. You review on your phone. Approve → merge.
5. The `production` environment asks you to approve the deploy. Approve →
   migrations apply, then the code deploys. Done.
