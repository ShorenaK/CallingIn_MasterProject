# AI Development Log — Sprint 02

## Entry 01 — Branch and planning setup

**Date:** October 13, 2026  
**Tool:** OpenAI Codex  
**Branch:** `sprint-02-authentication`  
**Purpose:** Prepare the accounts/authentication sprint before implementation.

## User request and approval

The student requested starting Sprint 02, approved creating the branch and two
planning documents, and confirmed responsibility for staging, commits, and pushes.
The agent explained what would change, why it was needed, and how it would be done.

## Approved actions

- Inspect the starting branch and working tree.
- Create `sprint-02-authentication` from current main at `dc21195`.
- Create the Sprint 02 checklist and this AI development log.
- Check formatting and whitespace for the new documents.

## Result

Created the branch and planning documents. The plan covers MongoDB, registration,
login, logout, profiles, protected endpoints, frontend forms, and relevant tests.
Database location and authentication design remain undecided and need approval.

No application code or dependency configuration was changed during this setup.
No credentials were created. Inherited documentation was preserved.

## Review and next step

The student reviews the proposed sequence. Before implementation, agree on the
database environment, account fields, session behavior, and dependency choices.
Record subsequent approved changes and actual verification results as new entries.

## Git handoff

The agent did not stage, commit, push, or merge. The student handles those actions.

## Related record

- [Sprint 02 progress and decisions](sprint-02-progress.md)

## Entry 02 — Atlas connection and backend registration

**Record date:** October 13, 2026

**Scope:** Approved MongoDB connection setup and backend registration.

### Approved work and outcome

Installed MongoDB driver 7.7.0, prepared safe environment configuration, and
added connection/ping logic with safe errors and shutdown cleanup. The student
confirmed resetting the exposed password. Both the agent and student verified
the live Atlas connection without creating account records.

After a separate approval, added registration for display name, email, and
password, using salted `scrypt` password hashes and a unique MongoDB email index.
The API exposes public account fields only. Login and frontend forms are outside
this completed step.

### Verification

`npm run check` passed after registration: lint, formatting, 13 backend tests,
and frontend build. Registration tests use simulated storage. No live account
creation or real Atlas unique-index test has been performed.

The student-run ping command was corrected to use `-e` after the original
interactive command failed because `--input-type` is not valid for the REPL.
The commands/work record includes the corrected command and file purposes.

### Next decision

Review new professor feedback before agreeing on further implementation.
No new scope or schedule is assumed until that feedback is available.

### Git handoff

Registration code and this record were not staged, committed, pushed, or merged
by the agent. The student remains responsible for those actions.

## Entry 03 — Shared lint and formatting setup

**Date:** October 16, 2026

The student approved consolidating existing tools before adding new rules.
Moved ESLint, Prettier, related configuration packages, and React lint plugins
to the repository root. Replaced both application ESLint configurations with
`eslint.config.mjs`, preserving complexity 10 and environment-specific rules.
Updated lint-staged and app-level commands to use the shared tools. No global
machine installation, new lint rule, type checker, or coverage gate was added.

The full project check passed: lint, formatting, all 13 tests, and build.
Application-level lint/format commands also passed. Checked effective browser,
Node, React hooks, and complexity settings, and confirmed invalid backend code
is rejected through the root ESLint invocation. No staged-file hook execution
is claimed: the agent did not stage files to run it.

All three installation audits reported zero known vulnerabilities. The student
handles staging, commits, pushes, and merges; none were performed by the agent.

## Entry 04 — Additional function limits

**Date:** October 16, 2026

After student approval, added `max-depth: 4`, `max-params: 4`, and
`max-lines-per-function: 60` excluding blank lines/comments. Kept complexity 10.
The frontend App exceeded the function-size limit, so it was split into a
connection hook and smaller components without intentionally changing behavior.
Backend functions passed the new limits without edits.

The accessibility plugin was not installed: version 6.10.2 does not declare
ESLint 10 compatibility. A read-only compatibility review found ESLint 9 is
end-of-life; downgrading or forcing the plugin was not performed.

The agent did not stage, commit, push, or merge. See the commands record for
verification commands; browser interaction verification remains separate.

Verification: the final `npm run check` passed lint, formatting, all 13 backend
tests, and frontend build. In-memory lint probes confirmed each new rule rejects
an intentional violation. Browser interaction checks were not performed.

## Entry 05 — Duplication audit and backend coverage

**Date:** October 16, 2026

With approval, extracted duplicated HTTP test setup into
`backend/test-support/server.js`. Application duplication did not justify
further consolidation at this stage.

Added root/backend `test:coverage` commands using Node's existing test runner.
The initial report omitted unexecuted server.js. Added seven meaningful tests
for missing configuration, safe client construction/cleanup errors, generic HTTP
error handling, and startup failure without real credentials. Extracted the
existing error middleware for direct testing without changing HTTP behavior.

All 20 tests passed. The report now includes every backend source file:
81.22% lines, 98.15% branches, and 84.21% functions. server.js has 27.45% line
coverage; successful startup, index failure, port failure, and shutdown still
need controlled tests. No claim of full behavioral coverage is made. Coverage
thresholds, CI, and a test-runner migration were not added.

The agent did not stage, commit, push, or merge.
