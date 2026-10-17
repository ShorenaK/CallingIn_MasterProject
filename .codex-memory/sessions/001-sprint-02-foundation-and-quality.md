# Session 001 — Sprint 02 foundation, quality, and agent collaboration

**Saved:** October 17, 2026 (America/New_York)

**Coverage:** Available conversation spanning Sprint 01 handoff and Sprint 02
work through October 17. This is one retrospective session record, not fabricated
individual sessions for the user's example database/dashboard filenames.

**Archive status:** Curated summary only; no full conversation transcript archived.
No passwords, private connection strings, or hidden agent logs are included.

## User goals and learning preferences

Build CallingIn for CS 8674 while learning the commands and development process.
The user wants short WHAT/WHY/HOW explanations and explicit approval before new
changes. They keep a first-person research journey about working with LLM agents,
including confusion, learning, cleanup, time/token concerns, and human control.
Do not invent feelings, citations, measured productivity gains, time, or token counts.

## Sprint 01 handoff and Git learning

- Organized sprint documents; shared meetings/planning/proposal/archive remain
  main records. Removed the duplicated AI log copy. Updated relative links.
- The user learned staging scope: git add . inside a subdirectory misses parent
  files. Commands should run from the project root or name explicit paths.
- Sprint-only deletions can propagate into main during a merge. The Sprint 01
  merge retained shared docs and resolved renamed quality notes.
- Sprint 01 merge: 4f77717. Daily guide and journey were prepared on main using
  a separate local linked worktree. No second git init/repository was created.
- The active desktop branch and a temporary main checkout have different file
  snapshots. Do not confuse separate checkout README files with duplicate files
  inside a single branch. Main was deliberately not merged into Sprint 02.

## Sprint 02 application work

- Created sprint-02-authentication from dc21195 and planning/log/command records.
- User created Atlas project/cluster and database user/network access. A private
  setting initially landed in tracked .env.example; it was restored to placeholders,
  and the user reported resetting the exposed password. Never repeat the old secret.
- Installed native MongoDB driver 7.7.0. Created database module and safe startup
  integration. User and agent independently observed successful live Atlas ping.
- Corrected a Node REPL instruction: --input-type=module needs a one-shot -e
  command here, not the interactive REPL.
- Implemented POST /api/auth/register with trimmed display name, normalized email,
  password validation (15–128 characters), random salt/scrypt hash, and unique
  email index. Responses exclude password/hash fields and hide driver errors.
- Registration tests use simulated storage; actual registration/index behavior
  against a dedicated live test database has not been verified.
- Login/logout, sessions, protected profiles, and frontend account forms remain
  unimplemented. Session design still needs user agreement.

## Professor feedback and quality work

Original feedback and copyable Claude prompts are preserved in
`doc/meetings/meeting-3_2026-10-12.md` on the sprint branch. It mentioned JSX
accessibility linting, extra complexity rules, Node linting, coverage, types,
shared configuration, and GitHub checks. The original Vitest wording is kept
separate from clarifications that this backend uses Node's test runner.

Approved work completed:

1. Consolidated shared ESLint/Prettier dependencies and rules at root; retained
   three package manifests and application-specific runtime dependencies.
2. Added depth/parameter/function-size limits while keeping complexity 10.
   Split App.jsx into a connection hook, Welcome, ProjectStatus, and smaller App.
3. Audited backend duplication and extracted HTTP test-server startup/cleanup
   to backend/test-support/server.js. Did not force unrelated abstractions.
4. Added test:coverage. The initial report omitted unexecuted server.js, so the
   high total was misleading as a whole-source view. Added failure tests, then
   extracted lifecycle.js and covered startup, port conflicts, signals, cleanup,
   and deadlines using controlled database/process interfaces.
5. Installed TypeScript as a dev checker, not a source-language migration.
   Added strict allowJs/checkJs/noEmit/JSDoc, missing React-root guard, numeric
   port normalization, and caught-error narrowing. Test/config typechecks deferred.
6. Prepared and pushed the GitHub Quality workflow on the sprint branch. It runs
   locked installs, lint, format, typecheck, coverage tests, build, and three audits.
   Required main status-check settings were not independently verified. No CD.
7. Corrected README drift and added .nvmrc/engines; CI reads the same version file.
   An npm ci dry-run unexpectedly cleared local dependency folders; disclosed it,
   restored all three packages from lockfiles, and reverified. Avoid repeating
   that dry-run on the active installation as though it cannot mutate anything.

Verification recorded during implementation, not rerun by this Save:

- Lint, formatting, source type checking, 31 backend tests, build: passed.
- Coverage: 100% lines, branches, functions across five backend source files.
  Tests do not establish complete frontend/accessibility/security behavior.
- Root/frontend/backend npm audits: zero known vulnerabilities at recorded runs.
- A frontend source-map-js finding was earlier fixed from 1.2.1 to 1.2.2.
- Clean temporary dependency installation and workflow command checks passed.
- User reported checks passed; no new remote CI status query was performed here.

## Claude audit and skill

Claude supplied prioritized audit items A–Q. Treat them as choices, not permission
or completed work. Items E (README drift) and M (Node consistency) were selected.
Coverage thresholds, dist untracking, expanded types, dependency/security scanners,
rate limiting, and frontend test packages were discussed but not all implemented.

Claude skill files on Sprint 02:

- .claude/skills/quality-review/SKILL.md — manual workflow.
- .claude/skills/quality-review/rubric.md — DRY/docs/meaningful tests criteria.
- .claude/skills/quality-review/report-template.md — measured vs judged vs not checked.
- .claude/claude-commands.md — invocation and timing instructions.
- CLAUDE.md — project instructions and approval boundaries.

Use /quality-review before a PR/substantial changes; full at sprint completion.
One full review can cover PR and sprint end. It is not a scheduled background job.
Runs project-wide commands even when code-reading scope is changed files. Builds
must use a scratch output to avoid tracked dist changes. Saving reports requires
approval. The template was corrected to mark .nvmrc/engines resolved on October 17.

Agent roles: Codex normally implements/explains, Claude independently reviews,
Shorena sets priorities/approves/handles Git. Either agent can review the other's
implementation; don't have both editing the same task or duplicate every small review.

## Main records, delegated Git actions, and future features

The main journey contains October 16/17 reflections and the team agreement.
Explicit one-time user delegations permitted these documentation commits/pushes:

| Commit  | Branch                   | Content                                               |
| ------- | ------------------------ | ----------------------------------------------------- |
| 7561929 | sprint-02-authentication | README roles and Claude guidance                      |
| 29fee22 | main                     | README roles and journey reflections                  |
| 36cfdab | main                     | One-time Git delegation decision                      |
| 1bf6ea2 | main                     | Future multilingual interface and message translation |

Pre-commit checks and pushes succeeded; no Sprint 02 merge was done. Future Git
operations revert to user responsibility unless specifically delegated again.
The latest multilingual addition remains uncommitted in the active sprint README
by user choice. Main has the committed version. Do not clean it up unasked.

Translations/interface languages are future planning only. Keep original text,
label translations, and let users review before sending. No language/provider
selection or implementation was approved.

## Changed implementation/configuration files across this history

- backend/src/: app.js, database.js, registration.js, lifecycle.js, server.js.
- backend/test/: health, database, registration, errors, server, lifecycle tests;
  backend/test-support/server.js for shared test HTTP setup.
- frontend/src/App.jsx and main.jsx; initial styles/assets retained.
- Root/app package.json and lockfiles; eslint.config.mjs replacing app configs;
  .lintstagedrc.json; tsconfig.base.json and app tsconfigs; .nvmrc.
- .github/workflows/quality.yml, README/docs, Claude skill and command files.

These are historical changes, not a claim all are new/uncommitted now or present
on main. Inspect relevant branch source rather than recreating them from this list.

## Remaining work and restart plan

Read PROJECT_STATE and DECISIONS, inspect current status, and present a short plan.
Next core feature decision is sessions/login/logout/profiles, followed by frontend
forms and meaningful integration/browser testing. Accessibility is explicitly
waiting for professor discussion. Do not add all audit tools or merge branches.

Memory setup approved here creates root AGENTS.md and .codex-memory files on
main only. No implementation edits, staging, commits, pushes, merges, or full
transcript export are included. Save these files durably before deleting chat.
