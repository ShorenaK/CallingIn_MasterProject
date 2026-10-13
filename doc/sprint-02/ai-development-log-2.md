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
