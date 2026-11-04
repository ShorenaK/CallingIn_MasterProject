# Sprint 5 — Commands and step record

**Prepared:** November 3, 2026 (America/New_York)

**Branch:** `sprint-05-ai-coach`

## Setup command actually run

From the clean Desktop checkout, after Shorena requested Sprint 5 setup:

```bash
git switch -c sprint-05-ai-coach main
```

Starting commit: `0017bbf`. Existing branches were retained. No commit or push
was included. This command records history; do not rerun it on restoration.

## Read-only checks before future work

```bash
git status --short --branch
git worktree list
git log -5 --oneline
```

Read AGENTS.md, the [plan](sprint-5.md), [progress notes](sprint-05-progress.md),
and current package scripts. Existing memory/report commands are not approval.
Do not read private `.env` files or print credentials.

## Existing project checks — examples, not run for setup

From the repository root:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
npm run test:e2e
```

Backend tests use temporary local ports and simulated storage. Browser tests
use mocked APIs in Chromium. They do not establish live AI-provider or Atlas
behavior, Safari, or human accessibility. Record exact results when actually run.

For a review build that preserves tracked dist output:

```bash
sprint05_build_path=$(mktemp -d /private/tmp/callingin-sprint05-build.XXXXXX)
npm --prefix frontend run build -- --outDir "$sprint05_build_path" --emptyOutDir
```

Installations, network audits/provider calls, live database checks, and Git
submissions need their applicable approval. No new dependencies are chosen by
these examples. Do not run force audit remediation or automatically alter schemas.

## Development servers — only when needed and approved

Existing scripts, from separate terminals at the repository root:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

The backend loads its own configuration; do not display private settings. Avoid
starting duplicate servers or changing connection settings to resolve a port
conflict without first inspecting what is running. These scripts were not started
as part of Sprint 5 documentation setup.

## Decline cooldown foundation — approved local verification

```bash
node --test backend/test/invitation-cooldown.test.js
```

The new timing tests use a controlled clock and require no server or database.
The existing `npm run test:coverage` additionally exercises the repeated-decline
HTTP regression using local ports and simulated storage. These commands do not
migrate indexes or enable re-invitations. See the dated progress entry for actual
results; examples do not authorize future commands automatically.

## Git handoff

Shorena normally owns staging, commits, pushes, and merges, with task-specific
delegation when explicitly requested. Before a delegated submission, inspect the
pending files and staged scope, run relevant checks, and use normal hooks. Do not
merge Sprint 5 into main until its work and evidence are reviewed and Shorena
explicitly approves that merge.
