# Session 004 — Sprint 4 conversations, Social Battery, and live verification

**Saved:** November 3, 2026 (America/New_York).

**Archive:** Curated handoff only. No full transcript exported or archived.
No private environment files, credentials, session cookies, or generated test
passwords were read into or copied to memory. Prior sessions remain unchanged.

## Latest request and working agreement

Shorena asked to save this session using CX Save Session so a new chat can read
what was done. This authorizes memory documents only, not another Git submission,
merge, new implementation, network check, or Claude invocation.

She wants short, practical explanations, one approved step at a time. Before
new implementation explain WHAT, WHY, HOW, WHERE, IMPACT, and RECOMMENDATION,
then wait for explicit approval. Codex implements; Claude independently reviews.
Do not automatically spawn agents. Git delegations are task-specific.

Work is Sprint 4. Do not reopen the completed Sprint 3 branch; only its explicitly
carried live/manual evidence gaps remain relevant. The user intends to merge after
review and closeout. This is future intent, not approval to merge immediately.
Outstanding checks must pass or be explicitly accepted as limitations, and final
merge approval is still required.

## Git/worktree state verified during this save

- Desktop: `/Users/shorenaanzhilov/Desktop/CallingIn`,
  `sprint-04-conversations` at **589032c**, clean before saving, matching the local
  `origin/sprint-04-conversations` ref. No remote fetch/check was run for this save.
- Main: `/private/tmp/CallingIn-main-design-20261103`, at **1db8bd9**, clean before
  saving, matching the local `origin/main` ref. Locate it with `git worktree list`
  next time; temporary paths can disappear.
- Main has docs/design-reference work, not the unmerged Sprint 4 implementation.
  Do not describe Sprint 4 runtime code as already on main.
- `/private/tmp/CallingIn-main-followups-20261102` is a stale prunable worktree
  registration and no longer exists. A prunable detached Sprint 2 registration
  also remains. No cleanup, branch switch, or worktree change was performed.
- Retained Sprint 3 branch remains at `2b9912c`; leave it untouched.
- This save updates INDEX, PROJECT_STATE, DECISIONS and creates this new session
  in canonical main memory, with matching copies in Desktop Sprint 4 so a new
  chat opened there can read the latest handoff directly. These writes are local
  and uncommitted until separately approved. No application/docs outside memory
  are changed by the save.

## November 2 work completed in this conversation

The user restored session 003, approved each implementation step, and separately
authorized the corresponding commit/push flows:

| Commit    | Work                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `1da01fa` | Accepted invitation opens/retrieves one participant-only conversation; strict validator and unique invitation index; tests. |
| `cedb901` | Send/read messages, participant guard, validation, cursor history, account sending limit; tests.                            |
| `62ea395` | Sprint 4 checklist and November 3 Meeting 5 agenda; all five Meeting 4 question sections copied without changing Meeting 4. |
| `ccce3c4` | Conversation screens and reply composer, existing invitation assertion updates, draft/expiry/stale-request handling.        |
| `72bb8a8` | Detailed progress notes and updated checklist/meeting status.                                                               |

The user wanted unfinished testing, live/human checks, requested editing,
Social Battery discussion/approved implementation, and Claude's skill review
next. More Meeting 5 questions were planned; do not invent advisor answers.

At the first messaging checkpoint 225 backend tests passed (simulated storage;
100% lines/functions, 98.26% branches). The UI checkpoint passed 36 existing
mocked Chromium tests, static checks and scratch build. A scratch mocked smoke
script passed opening/reading/sending/older history/draft/error/expiry/axe/phone-
width checks. An optional additional smoke run did not execute because automatic
approval review could not complete under an account usage limit. These are older
checkpoint results, superseded by later documented checks below.

## Subsequent November 3 work verified from current source and committed reports

The checkout advanced beyond the earlier chat checkpoint. This save read the
current source/reports and Git to incorporate those later changes. The figures
below are recorded implementation/review evidence, not tests rerun during saving.

| Commit    | Recorded work                                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `69c3fbe` | Invitation response palette update.                                                                                                                   |
| `fd0b855` | Approved Social Battery and permanent messaging browser coverage. Claude reviewed this checkpoint.                                                    |
| `11ee203` | Expired-history loading/duplicate-announcement fixes and then-current Busy contrast.                                                                  |
| `828ea32` | Reject invisible-only invitations/replies, preserving multilingual/joiner/emoji text; tests.                                                          |
| `44ef40b` | Horizontal green/amber/coral SVG battery design with half-filled Busy, wider cards, full-width Save Status, blush personal-space invitation response. |
| `251ffbc` | Remove obsolete Sprint 2/health panel and frontend health calls; preserve design/review references.                                                   |
| `d581e7d` | Simplified copyright footer and user-reported live-test notes.                                                                                        |
| `9eb4bea` | Equal-sized invitation Send/Cancel controls and responsive alignment.                                                                                 |
| `589032c` | Guard both account navigation links against discarding replies; ten navigation browser tests; welcome comma; independent live report/progress update. |

Main docs/design-reference commits include `c8e2b91` and `1db8bd9`. Do not silently
merge or move branches to obtain those references.

## Current behavior and architecture

React 19/Vite frontend, Express 5, native MongoDB driver, JavaScript with strict
checkJs/JSDoc; preserve frontend/backend layout. Node 26.x, selected 26.0.0.
No new dependency or database administration migration was needed for these
Sprint 4 features. Existing account, session, origin/JSON, and safe-logging guards
remain the foundation.

Conversation opening: `POST /api/invitations/:id/conversation`. Either participant
of an accepted invitation can open the room; unique invitation index/upsert makes
retries converge. Pending/deferred/declined invitations cannot open it. Missing
and outsider access share 404. Acceptance remains a separate consent step.

Messaging: `POST`/`GET /api/conversations/:id/messages`. Every call verifies the
current account and room membership. Sender, room ID, message ID/time are server-
controlled. Trimmed text must have visible content and fit 1–5,000 UTF-16 units;
16 KB JSON limit applies independently. Newest-first history uses createdAt/ID
cursor ordering, default 20/max 50. Sending allows 60 attempts/account/minute
across rooms; process-local counters reset on restart. Strict messages validator
and compound history index are prepared at startup; mismatches need deliberate
administrator action, not silent collMod.

Conversation UI: accepted Received/Sent cards open chats; chronological reading,
Load older messages, manual Refresh messages, replies, retained text after errors
or expiry, explicit sign-in, discard confirmation and focus handling. No automatic
live updates or browser-storage draft persistence. Invitation drafts stay mounted
while chat is visible. Request lifecycle checks reject stale replies.

Social Battery IS IMPLEMENTED; older notes saying undecided/unbuilt are historical.
Owners explicitly save `open`, `busy`, or `space` in optional `users.socialBattery`;
missing means Not set. Only owners write; accepted room partners read availability
with manual Refresh availability. No blocking, diagnosis, automatic expiry,
people count, or payment feature. Final design is full green, half amber, low
soft-coral segmented SVGs, native radios, visible labels/focus. Routes:
`GET`/`PATCH /api/users/me/social-battery` and
`GET /api/conversations/:id/social-battery`.

Navigation: Your account and Go to your account close an empty chat and focus
profile. Written replies require Keep writing / Discard and go to account;
Keep writing focuses the reply. Sending blocks navigation. Existing separate
Back to invitations/discard behavior and invitation drafts remain.

The permanent one-invitation-per-unordered-pair rule still applies, including
after decline. No 30-day re-invitation policy is implemented. AI Coach, payments,
Freemium/Premium, editing/deleting messages, attachments and read receipts remain
future work. Card/font alignment and optional refactors remain deferred.

## Verification and review evidence

Current committed progress/report checkpoint records:

- **267 backend tests passed**, zero failures/skips, **100% lines/functions,
  98.35% branches**, using simulated storage/HTTP tests.
- **79 Chromium tests passed** in one combined mocked-API run, including ten
  navigation tests and axe scans. No frontend coverage percentage measured.
- **101 independent live assertions passed**, zero failures, against the running
  frontend/backend and configured MongoDB, using three isolated generated accounts.
  No API mocking. Confirmed room/messaging/battery flows, reload persistence,
  outsider/logged-out rejection, pagination, text boundaries, draft cancellation,
  navigation, revoked-session recovery, and dedicated account sending/email limits.
- Live axe zero violations for selected tags; automated 390px viewport had no
  horizontal overflow. Neither certifies human accessibility or an actual phone.
- Latest recorded lint, type checks, repository formatting/whitespace and scratch
  build passed; tracked dist unchanged.
- Earlier root/frontend/backend audits reported zero vulnerabilities and Quality
  at **828ea32** passed. These are checkpoint-specific historical results, not a
  fresh CI/audit claim for **589032c** or this new memory save.
- Claude's `doc/sprint-04/quality-review-2026-11-03.md` reviewed **fd0b855**, no
  blockers; recorded 241 backend/64 mocked browser tests and five low/medium
  findings. Follow-up fixes came later. Optional query reuse/storage preparation
  refactors were deferred. Claude has not independently reviewed every later fix,
  visual adjustment or account-navigation change.

During THIS save: inspected current Git/worktrees, memory, source, progress,
checklist, Social Battery API/reference, and review/live reports. Verified memory
formatting, local links and scope after writing. Did not run suites, new audits,
GitHub requests, live checks, or Claude's skill merely to save.

## Live data and evidence boundaries

The report `doc/sprint-04/live-verification-2026-11-03.md` describes batch
`72239c9d`: three synthetic test accounts, three invitations, two rooms and
generated message history remain for review. Passwords were generated in memory
and not retained. Account C intentionally reached temporary limiter budgets.
No cleanup or deletions were performed; do not delete records without approval.
The app handled writes through its configured connection; no raw database metadata
or backup inspection was done. Existing-room concurrent opens passed; an initial
room-creation race was not tested live. User-reported earlier tests remain separate
from the independently recorded live batch. A reported duplicate concern was
corrected by Shorena and was not a confirmed bug; live duplicate/reverse sends 409.

## Remaining work and proposed next continuation

Read current Sprint 4 progress/checklist before choosing the next step. Some
checkboxes combine completed and unfinished checks; use the latest dated detail.

1. Focused Claude review of changes after `fd0b855`, especially later validation,
   navigation, drafts, and async lifecycle behavior; record exact reviewed commit.
   A Claude prompt was supplied in chat, but supplying a prompt is not a new review.
2. Finish or explicitly accept limits for backend-restart persistence, raw
   validators/indexes/startup checks and backup evidence (including two startups
   per `callingin_dev` and `callingin_sprint03_verify`). Ask before live checks.
3. Initial simultaneous room-creation race; live 5,000-unit invitation acceptance
   boundary (5,001 rejection and reply boundaries were checked).
4. Shared-IP 100-login ceiling, cross-IP email failures, process-reset behavior;
   only isolated-account email budget was saturated live.
5. Natural idle expiry, Change person/lookup expiry and real OS clipboard copying;
   revoked-session retention/focus/sign-in passed live.
6. Human keyboard-only walkthrough across accounts/invitations/chats/battery,
   VoiceOver, Safari, 200% zoom and actual phone. Automated axe/viewport evidence
   does not complete these.
7. Gather any further approved UI edits and meeting questions; don't revive all
   deferred design ideas automatically. More Meeting 5 questions were planned.
8. Update shared README/current implementation wording when appropriate to the
   approved main-merge workflow. Verify hosted Quality on the actual merge-ready
   commit, resolve findings, then ask for explicit final merge approval.

No Sprint 4 merge occurred. User's latest intent is review then merge, with final
readiness/limitations reviewed first. Restore is read-only; don't infer permission
for implementation, external checks, Git submissions, cleanup, or merging.

## Files to read in a new chat

On Desktop Sprint 4: `doc/sprint-04/sprint-04-progress.md`, `sprint-4.md`,
`quality-review-2026-11-03.md`, `live-verification-2026-11-03.md`,
`live-manual-testing-2026-11-03.md`, `social-battery.md`, and current source.
Meeting: `doc/meetings/meeting-5_2026-11-03.md`.
These Sprint-only documents are not yet on main. Read Desktop directly without
switching/merging. This memory is a curated record, not the full transcript.
