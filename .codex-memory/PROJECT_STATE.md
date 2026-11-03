# CallingIn — Current project state

**Snapshot:** November 3, 2026 (America/New_York).
Supersedes the pre-Sprint-4 state; prior history is retained in sessions 001–003.
Verify current Git/source before acting. Latest: [Session 004](sessions/004-sprint-04-conversations-battery-and-live-verification.md).

## Git and workflow

- Desktop `sprint-04-conversations` at **589032c**, clean before this memory save,
  matching local origin tracking ref. Sprint 4 is implemented but NOT merged.
- Main at **1db8bd9** in `/private/tmp/CallingIn-main-design-20261103`, clean before
  save; matches local origin tracking ref. Main has shared design docs, not the
  unmerged Sprint 4 application. Locate current checkout using `git worktree list`.
- Old `/private/tmp/CallingIn-main-followups-20261102` registration is stale and
  prunable; directory absent. No cleanup authorized. Sprint 3 remains complete
  and retained at `2b9912c`; do not revisit it unless asked.
- Session 004 plus updated index/state/decisions are saved in canonical main memory
  and copied to Desktop for direct new-chat access. This save is local/uncommitted
  until separately approved; no stage/commit/push/merge included.
- Explain WHAT/WHY/HOW/WHERE/IMPACT/RECOMMENDATION before implementation and wait
  for approval. Codex implements, Claude independently reviews; one editor/task.
  Git delegations are bounded to the named task. Keep explanations short/practical.

## Implemented architecture

React 19/Vite + Express 5 + native MongoDB driver. JavaScript strict checkJs/JSDoc;
frontend/backend layout retained. Node 26.x, selected 26.0.0. Never open private
.env or print credentials. No dependency installation in the recorded Sprint 4 work.

Accounts: registration/login/logout, name-only profile editing, Mongo-backed
HttpOnly cookie sessions, optional 90-day inactivity persistence and verified
account/origin/JSON guards. New passwords 8–18, no whitespace or full email
substring (case-insensitive); legacy sign-in 8–128 including whitespace. Login
10 credential failures/email/15 min across IPs, 100 requests/IP/15 min; successes
refund their reservation without erasing previous failures. Process-local stores;
shared limiter/proxy planning remains for deployment.

Invitations: exact-email lookup, incoming/outgoing cursor lists, recipient-only
response transitions and final-choice protection. Permanent unique unordered pair
still blocks repeats, including after decline; 30-day retry is not implemented.
Trimmed invitations/replies require visible content and 1–5,000 UTF-16 units;
independent JSON body limit is 16 KB. Invisible-only input is rejected while
multilingual/joiner/emoji content remains supported.

Conversations/messages: accepted invitation opens one shared participant-only
room (`POST /api/invitations/:id/conversation`), unique invitation index/upsert.
`POST`/`GET /api/conversations/:id/messages` verify account and membership;
server-derived sender/IDs/time. History newest-first createdAt/ID cursor, default
20/max 50. Send limit 60 attempts/account/min across rooms. Strict collection
validation/indexes prepared on startup; mismatched existing validators require
an administrator update, not automatic collMod.

UI: open accepted Received/Sent invitation chats; chronological display, older
pages, manual refresh, replies, retained drafts on error/expiry, explicit sign-in,
discard confirmations/focus and stale-request guards. No browser storage for
unsent text. Both account links guard written replies and block during sending;
empty chat closes and focuses profile, Keep writing focuses reply. Existing
invitation drafts remain intact. Obsolete frontend health/status panel removed.

Social Battery is implemented (older undecided notes are superseded): optional
`users.socialBattery`, owner explicit Save Status, values open/busy/space, absent
Not set. Room partners read it privately and refresh manually. Final segmented
SVGs: full green, half amber, low coral. No blocking, diagnosis, automatic expiry,
people count or subscriptions. Own GET/PATCH `/api/users/me/social-battery`;
partner GET `/api/conversations/:id/social-battery`.

## Evidence and review checkpoint

Committed progress at 589032c records **267 backend tests**, **100% lines/functions,
98.35% branches** (simulated storage); **79 combined mocked Chromium tests**
with axe; **101 independent live assertions**, zero failures against running app
and configured MongoDB with three isolated accounts. Live report distinguishes
actual outcomes and limits; no frontend coverage percentage measured.

Latest recorded static checks/scratch build passed; dist preserved. Prior audits
zero and GitHub Quality at **828ea32** succeeded; these do not certify later HEAD.
Claude reviewed **fd0b855**, no blockers, 241 backend/64 browser tests; later
approved fixes and navigation need focused follow-up. Do not request the same
initial review as though none exists. Skill: `.claude/skills/quality-review/SKILL.md`.

These are historical implementation/report results. Saving did not rerun suites,
audits, GitHub, live checks or Claude. During save inspected current Git/source/
docs and checked memory formatting/links/scope. Live batch 72239c9d left synthetic
accounts/invitations/rooms/messages; passwords not retained, no auto-cleanup.

## Remaining before closeout

- Focused Claude follow-up after fd0b855; any approved findings/fixes.
- Backend restart/persistence, raw validator/index/startup and backup evidence,
  including database-specific two-startup items. Initial room-creation race and
  live 5,000-unit invitation acceptance boundary remain.
- Shared-IP/cross-IP/restart login-limit checks, natural idle expiry and lookup
  expiry recovery, real OS clipboard copying. Recorded live revoked-session,
  message boundaries, duplicate rejection and outsider checks already passed.
- Human keyboard-only walkthrough, VoiceOver, Safari, 200% zoom, actual phone.
  Automated live axe/390px viewport are not substitutes.
- Further requested edits/Meeting 5 questions, current documentation cleanup,
  current-commit GitHub Quality, accepted limitations and final merge approval.

User intends to merge after review; no immediate/final merge authorization.
Do not repeat completed tests blindly or reopen prior sprints. Use latest dated
Sprint 4 reports because some checklist items combine completed/pending evidence.
Social Battery is done; AI Coach/payment/Freemium/Premium remain future planning.
Palette beyond approved changes, envelope/emoji, 30-day retry, copy/design and
optional refactors are separate tasks, not automatic scope.

Read on Desktop: `doc/sprint-04/sprint-04-progress.md`, `sprint-4.md`,
`quality-review-2026-11-03.md`, `live-verification-2026-11-03.md`,
`live-manual-testing-2026-11-03.md`, `social-battery.md`, and Meeting 5.
These unmerged documents aren't on main. Save/restore is curated memory, not a
full transcript archive; no full transcript exported.
