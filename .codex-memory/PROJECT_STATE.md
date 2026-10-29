# CallingIn — Current project state

**Snapshot:** October 29, 2026 (America/New_York). Supersedes the October 17 snapshot;
that history remains in session 001. Verify source/Git before acting.

## Current checkout and handoff

- Desktop checkout: `/Users/shorenaanzhilov/Desktop/CallingIn`, on `main` at
  `38a9a3c`, synchronized with origin before this save.
- Sprint 2 merged and pushed with explicit approval. Its branch remains intact.
- Local `sprint-03-invitations` created from `38a9a3c`; not checked out or pushed.
- Current uncommitted work: memory session 002/index/state/decisions, Meeting 4
  questions, and Sprint 3 planning records. Save/setup does not authorize Git submission.
- An isolated merge worktree exists at `/private/tmp/CallingIn-sprint02-merge`
  (detached `38a9a3c`). It is temporary; no private environment files copied there.
- Origin still uses CallingIn_new and GitHub redirects to CallingIn_MasterProject.
  Git fetch/push works; gh CLI authentication returned HTTP 401 during merge.

## Architecture and completed Sprint 2

React/JavaScript + Vite frontend, Express/JavaScript backend, native MongoDB driver.
Atlas configuration lives in ignored backend/.env; never display secrets.
Strict checkJs/JSDoc is a development checker, not application TypeScript migration.

Backend routes: POST /api/auth/register, POST /api/auth/login,
POST /api/auth/logout, GET/PATCH /api/auth/me. Profile editing is display name only.
Fixed-cost salted scrypt password storage; shared account-policy/password helpers.
MongoDB-backed sessions, HttpOnly SameSite=Lax cookies, optional 90-day inactivity
persistence, session regeneration on login, logout server invalidation. Origin/JSON
protection precedes writes. Separate per-IP registration (5/15 min) and login
(10/15 min) limiters use process-local stores. No blind proxy trust.
Safe account logging allowlists metadata, excludes raw errors/request credentials.
Login preserves existing sessions on failure before regeneration and removes new
authorization before failed-session cleanup. Frontend forms support registration,
login, Keep me signed in, restore, profile edit/read, logout, feedback, pending states.

## Evidence and limits

Historical checks in this chat: 98 backend tests passed; latest coverage run
100% lines/functions, 99.57% branches. Tests cover cookie 90-day expiry, real auth
startup with simulated storage, session-ID replacement/replay, partial-config
rejection. Merged main result passed 98 tests, lint, types, formatting, and scratch
build. No suite rerun merely for this save.

Backend security fixes: body-parser 2.4.0 and qs 6.17.0; last root/frontend/backend
audits all zero vulnerabilities. Do not assume advisories stay unchanged.
Student confirmed GitHub Quality green including merged main; agent could not
independently query hosted runs because gh authentication failed.
Student reported browser registration/duplicate rejection, login/refresh, profile
save/refresh, logout/refresh, keep-signed-in tab reopening, wrong-password rejection,
invalid-input blocking, and keyboard/focus checks passed. Agent reviewed welcome
mobile screenshot only. Database environment was never confirmed in chat; do not
claim independently verified Atlas account persistence. Full mobile account forms,
full browser restart, and screen-reader verification remain unverified.

## Current next task: Sprint 3 invitations

Planning records: doc/sprint-03/. No invitation code or final model/API approved.
Explain design and receive explicit approval before implementation. Decide lookup
privacy, statuses/fields, duplicates/self-invitations, recipient-only responses,
and Sprint 4 conversation handoff. Do not invent invitation requirements.
Before switching to Sprint 3, review/submit current shared main records with
separate Git approval, then update the local Sprint 3 branch to that main tip.

## Deferred decisions

Password changes and all-session invalidation/session stringify:false are deferred.
Production proxy configuration waits for hosting topology. Accessibility tooling
awaits professor input; no Playwright/axe suite installed. Full independent final
Claude review was not performed in this chat. Tracked dist outputs, coverage gates,
expanded type-check scope, branch protection, and other guardrail ideas are not
implicitly authorized. Use temporary build output to avoid tracked-dist changes.

Meeting 4 is doc/meetings/meeting-4_2026-10-27.md; date preserved, responses unrecorded.
New questions cover saved-session continuity and multi-agent business/AWS operations.
README future ideas are exploratory: communication coach, possible separate Trusted
Circle app, memoir-writing assistant; no current scope change.

## Restore

Read AGENTS.md, INDEX, DECISIONS, and session 002. Inspect current Git/source.
Give a short status and propose the next approved boundary; do not execute saved
commands automatically. No full transcript was archived.
