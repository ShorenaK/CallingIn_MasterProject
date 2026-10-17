# CallingIn — Current project state

**Snapshot date:** October 17, 2026 (America/New_York)

## Purpose and scope

CS 8674 project by Shorena K. Anzhilov, advised by Professor Albert Lionelle.
The semester MVP is AI-assisted communication: accounts/profiles, invitations,
private conversations, basic Social Battery, and AI-assisted drafting.
Trusted Circle, Gratitude List, Life Reflections, and multilingual interface/
message translation are future possibilities, not implemented Sprint 02 features.

## Architecture and branch boundary

- Frontend: React/JavaScript with Vite in `frontend/`.
- Backend: Node.js/Express with the native MongoDB driver in `backend/`.
- Development database: MongoDB Atlas; private configuration in ignored
  `backend/.env`. Safe placeholders only in tracked `.env.example`.
- Application source remains JavaScript. TypeScript is a development checker,
  not a migration to `.ts` application source.

**Do not conflate main with the sprint implementation.** At this snapshot:

| Checkout                                   | Branch                   | Recorded tip | Role                                           |
| ------------------------------------------ | ------------------------ | ------------ | ---------------------------------------------- |
| `/Users/shorenaanzhilov/Desktop/CallingIn` | sprint-02-authentication | `7561929`    | Active implementation and Claude skill         |
| `/private/tmp/CallingIn-main-docs`         | main                     | `1bf6ea2`    | Shared docs/journey and this new memory system |

The temporary main location is a linked worktree of the same repository, not a
separate Git repository. It may not persist indefinitely; locate checkouts with
`git worktree list`. The desktop checkout has an uncommitted multilingual README
addition that the user explicitly left in place; do not discard or stage it
without approval. Main has the same future-feature addition committed.
Memory initialization itself is uncommitted on main until the user submits it.
Branch tips and cleanliness must be rechecked, not assumed current forever.

The configured origin uses the old CallingIn_new URL; successful pushes redirected
to `https://github.com/ShorenaK/CallingIn_MasterProject.git`. No remote URL was
changed. Shared Git metadata does not make branch file contents identical.

## Completed on Sprint 02

- Created sprint branch and records under `doc/sprint-02/`.
- Atlas connection/ping verified by agent and user; secrets were not retained.
- Native MongoDB driver installed (7.7.0 at installation).
- Registration endpoint `POST /api/auth/register`: display name, normalized
  email, password validation, salted scrypt hash, unique email index, safe errors.
- Lifecycle module ensures database/index setup precedes listening and supports
  cleanup, signals, port-conflict handling, and shutdown deadline testing.
- Shared test-server helper removes repeated test setup.
- Root ESLint/Prettier tooling and root `eslint.config.mjs`; React/browser and
  Node-specific environments are scoped separately.
- Complexity 10, depth 4, parameters 4, function length 60 excluding comments/blanks.
- Strict checkJs/JSDoc source checks with noEmit, frontend/backend tsconfigs.
- Backend coverage reporting with Node's built-in test runner, not Vitest.
- GitHub Quality workflow: locked installs, lint, format, types, coverage tests,
  build, three audits. Uses `.nvmrc` Node 26.0.0, package engines >=26.0.0 <27.
- Project-local Claude quality-review skill, rubric, report template, command guide,
  and CLAUDE.md. Manual changed/full review; it does not auto-edit or auto-run.
- README corrections, team agreement, and documentation updates.

## Verification evidence and limits

Latest recorded implementation runs on October 16: lint, formatting, source type
checks, **31 backend tests**, and build passed. Coverage measured 100% lines,
branches, and functions across five backend source files. A clean temporary
install also passed checks. Three audits reported zero known vulnerabilities
at their recorded runs. These are historical observations, not fresh results
from October 17's memory save, and coverage is not proof of complete behavior.

Live Atlas ping passed, but account creation and real unique-email enforcement
against a separate test database remain unverified. No frontend browser-test
suite is installed. The user reported checks passed on GitHub; hosted run details
and main required-status-check enforcement were not independently verified.
GitHub CLI access last returned HTTP 401; ordinary git fetch/push did work.

## Remaining core Sprint 02 work

1. Agree on session persistence, cookie/session design, logout, and dependencies.
2. Implement login, logout, protected endpoints, and profile read/update behavior.
3. Agree on editable profile fields beyond display name/email/password registration.
4. Build frontend registration/login/profile/logout flows and authenticated state.
5. Verify real registration/duplicate email using isolated test data and approval.
6. Test wrong credentials, unauthorized access, expiry/logout, and browser UX.
7. Update records, run final checks and Claude full review; user decides readiness.
8. Merge only at sprint completion with explicit user approval, preserving shared docs.

## Deferred quality work and known gaps

- Accessibility plugin 6.10.2 last declared support only through ESLint 9.
  ESLint 9 was EOL, so keep ESLint 10 and do not force installation. Recheck
  compatibility when revisiting; metadata is a dated finding.
- Playwright/axe alternative documented but explicitly deferred for professor discussion.
- Backend eslint-plugin-n not installed.
- Coverage thresholds not enforced; 90% was suggested, not approved/implemented.
- Type checks exclude tests/test-support/tooling config; extending scope is pending.
- Four generated frontend/dist files remain tracked. Untracking was discussed,
  not performed. Avoid modifying them during review by using a scratch outDir.
- Rate limiting, frontend tests, Dependabot, CodeQL, secret scanning, pre-push
  hooks, and other Claude audit suggestions are not automatically approved work.
- Verify branch-protection rules separately from having a workflow in Git.
- Some top-level sprint progress wording is stale; later dated entries supersede it.

## Shared documentation on main

`README.md`, `doc/project-journey.md`, `doc/meetings/`, semester planning and
archives belong on main. The journey has October 16 and 17 research reflections,
team responsibilities, and the one-time Git-delegation decision. Do not invent
measured time/token savings or treat reflections as general research findings.

## Immediate continuation

The user is preparing to delete this long chat and requested file-based memory.
Finish verifying the memory files, then let the user review and explicitly
submit them before relying on a temporary checkout for long-term retention.
No additional feature implementation has been approved by this memory request.
