# Sprint 4 — Conversations progress

**Recorded:** November 2, 2026 (America/New_York)

**Branch:** `sprint-04-conversations`

**Implementation checkpoint:** `ccce3c4`, pushed; clean working tree before
this documentation update. This update itself is local until separately submitted.

**Current status (November 3):** Conversation/messaging and Social Battery are
implemented. Dedicated messaging and Social Battery regression tests pass locally.
The November 3 battery/test/documentation changes are uncommitted. Live/manual
verification and independent review remain; Sprint 4 is not complete or merged.
The original November 2 implementation checkpoint below is historical.

## Working agreement

Shorena approves one explained step at a time. Codex implements; Claude performs
an independent review. Explain WHAT, WHY, HOW, WHERE, IMPACT, and RECOMMENDATION
before new implementation. Git submissions require separate task-specific
approval. No automatic branch changes, merges, installations, or live checks.

Work stays on Sprint 4. Previously completed sprint work is not reopened; only
the outstanding checks explicitly carried forward remain on this sprint's list.

## Completed work and commits

| Commit    | Completed work                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1da01fa` | Open/retrieve one participant-only conversation for an accepted invitation; strict storage setup and tests.                                              |
| `cedb901` | Participant-only message sending and paginated history, validation, sending limits, storage setup, and tests.                                            |
| `62ea395` | Sprint 4 testing checklist and November 3 meeting agenda, including all five question sections copied from Meeting 4.                                    |
| `ccce3c4` | Conversation screens, reply composer, draft/error/expiry handling, responsive styles, existing browser assertion updates, and progress checklist update. |

Each commit was separately approved, committed with normal pre-commit checks,
and pushed. GitHub Quality for these commits has not been checked in this session.

### 1. Conversation opening

- `POST /api/invitations/:id/conversation` verifies the signed-in account,
  participation, and accepted invitation status.
- Either participant can open the room. Repeated and simultaneous opens converge
  on one room through an upsert and a unique invitation index; a duplicate-key
  race reads back the saved room.
- Outsiders and missing invitations share a 404. Unaccepted invitations return 409.
- Acceptance itself remains a separate consent action; opening the room happens
  afterward, including for invitations accepted before this implementation.
- Conversation records contain an invitation reference, two participant IDs,
  and a server creation time. Strict validation requires two distinct IDs.

Main files: `backend/src/conversation-opening.js`, `conversation-storage.js`,
`app.js`, and `lifecycle.js`; conversation, startup, and integration tests.

### 2. Message storage and APIs

- `POST /api/conversations/:id/messages` accepts only `{ text }` and derives the
  sender, conversation, message ID, and creation time on the server.
- `GET /api/conversations/:id/messages` returns only that authorized room's
  history. Both routes verify the current account and participation every time.
- Text must contain 1–5,000 UTF-16 code units after trimming. The separate 16 KB
  JSON body guard can reject a large encoded request before text validation.
- History is newest first, ordered by creation time then ID. The default page is
  20 messages, maximum 50; a cursor requests older messages without replacing
  conversation authorization.
- Sending allows 60 attempts per account per minute across rooms. Attempts count
  even if a later conversation or text check rejects them. Counters are
  process-local and reset on restart; multi-process deployment needs shared storage.
- The `messages` collection stores conversation ID, sender ID, text, and creation
  time. Its compound history index scopes the room and supports pagination.
- Startup prepares conversation/message collections and indexes and verifies
  exact strict validators. Existing rule mismatches stop startup rather than
  silently applying an administrative schema change.
- Failures use safe logging without message text or private database details.

Main files: `backend/src/conversation-access.js`, `messages.js`,
`message-storage.js`, `message-pagination.js`, and `message-rate-limit.js`,
plus route/startup/logging wiring and backend tests/test support.

### 3. Conversation screens

- Accepted cards in Received and Sent offer **Open conversation**.
- The screen shows the counterpart name, expandable invitation context, message
  authors/times, and text in chronological reading order.
- **Load older messages** retrieves more history; **Refresh messages** checks for
  new replies. This version has manual refresh, not automatic live updates.
- The reply form has a trimmed text count and prevents empty/over-limit sends.
  Enter adds a line; the Send reply button submits. Sending disables repeat
  submission, editing, and the Back action while the request is pending.
- A successful send adds the confirmed message and clears the reply. Failed
  sends retain text and advise refreshing history before retrying, because a
  lost response does not prove the server failed to save the message.
- Session expiry keeps the reply visible/read-only for copying before explicit
  sign-in. Back with written text asks Keep writing or Discard reply and go back.
- Invitation forms/lists remain mounted but hidden while a conversation is open,
  preserving an existing invitation draft. Focus handling is implemented for
  opening, older history, send feedback, draft confirmation, and expiry.
- Replies stay in page memory only. Reloading, signing out, or explicitly
  discarding can lose unsent text; no browser storage was added.
- Request lifecycle checks ignore stale results after refresh or unmount.
- The layout reuses the current palette and styles. No new package was installed.

Main files: `frontend/src/conversations/` (`Conversation.jsx`, `api.js`,
`useConversation.js`, `useReply.js`, and `conversations.css`), account/invitation
integration, and two updated assertions in `frontend/e2e/invitations.spec.js`.

### 4. Documentation and meeting preparation

- [Sprint 4 checklist](sprint-4.md) tracks the outstanding testing and review work.
- [Meeting 5 — November 3](../meetings/meeting-5_2026-11-03.md) has the Sprint 4
  agenda and all five Meeting 4 question sections, preserving their wording.
  Meeting 4 was not changed. More questions will be added tomorrow.
- Advisor responses and meeting outcomes have not been recorded.
- This progress record and its related documentation corrections were requested
  after the UI commit. No curated memory save or full transcript export was requested.

## Verification actually performed during implementation

| Check                                | Result and scope                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First backend step                   | 201 backend tests passed; tightened authentication fixture separately passed its 9 tests afterward.                                                                  |
| Messaging backend                    | 225 backend tests passed, zero failures/skips. Coverage: 100% lines/functions, 98.26% branches. Database methods were simulated.                                     |
| Existing browser suite after UI work | 36 Chromium tests passed with mocked APIs. Two old assertions now expect Open conversation instead of a future-feature notice.                                       |
| Temporary conversation smoke         | Passed mocked opening, reading, sending, older-message focus, draft confirmation, 503 recovery, 401 text retention, axe scan, and phone-width overflow check.        |
| Static/build checks                  | Repository lint, frontend/backend type checks, changed-file formatting, whitespace checks, and scratch frontend production build passed. Tracked dist was unchanged. |
| Visual inspection                    | Desktop and phone-width conversation screenshots inspected. These were automated browser screenshots, not an actual phone or human accessibility test.               |
| Git hooks                            | Normal ESLint/format checks passed on the submitted changes.                                                                                                         |

No frontend coverage percentage was measured. The temporary smoke script and
screenshots are scratch artifacts, not committed messaging regression tests.
Coverage measures execution and does not prove correctness or live MongoDB atomicity.

### Corrections and verification limits

- Initial local HTTP tests hit sandbox port restrictions; the permitted rerun
  passed with simulated storage, without Atlas access.
- Large UI/test helpers were split to meet existing function-length and complexity
  rules. A copied storage-test index expectation was corrected before passing.
- The initial smoke harness needed an explicit browser context for axe. Its
  corrected run passed.
- An optional extra smoke run for return-focus and over-limit behavior did not
  execute because automatic approval review could not complete due to an account
  usage limit. Do not count those extra checks as passed.
- Markdown header line-break spaces initially failed staged whitespace checks;
  blank lines replaced them before the documentation commit passed.
- No new live Atlas check, human keyboard walkthrough, Safari, VoiceOver, actual
  phone check, network audit, or hosted CI verification was performed in this work.
- During this progress-note update, Git/source/docs were inspected and documentation
  formatting/links checked; application suites were not rerun merely to write notes.

## Tomorrow — November 3: testing, decisions, corrections, then Claude review

Shorena plans to finish outstanding testing, discuss Social Battery and other
requested changes, make approved edits/corrections, then have Claude run the
quality-review skill. If review finds issues, approve fixes and recheck affected
behavior. Completion depends on actual evidence, not the planned date.

### Automated messaging coverage — completed locally November 3

- [x] Commit dedicated browser tests for opening from both invitation lists,
      reading/sending, older messages, refresh, and empty history.
- [x] Cover text boundaries, sending limits, errors/retries, expired sessions,
      retained text, and discard/keep behavior.
- [x] Cover stale history/send replies after refresh, navigation, or unmount,
      plus preservation of existing invitation drafts.
- [x] Add keyboard/focus and accessibility assertions for the new controls.
- [x] Run new and existing suites together after the final edits.

### Live/manual work still outstanding

- [ ] Verify real-account messaging, shared-room identity, persistence after
      reload/restart, pagination, outsider rejection, logout, and expired sessions.
      Use separate browser profiles for independent accounts.
- [ ] Check live invitation and reply 5,000/5,001 UTF-16-unit boundaries,
      independently of the JSON body limit; verify message sending limits.
- [ ] Verify login limits after restarting the backend: 10 credential failures per
      normalized email and 100 requests per IP per 15 minutes; successes do not
      consume the email allowance or erase earlier failures.
- [ ] Check Cancel/Keep writing/Discard, focus, and actual retained-text copying
      after expiry, including Change person/lookup recovery.
- [ ] Perform the human keyboard-only walkthrough using Tab, Shift+Tab, Enter,
      and Space through accounts, invitations, confirmations, pagination, and
      conversations. Check visible focus, logical order, and real text copying.
- [ ] Complete VoiceOver, Safari, 200% zoom, phone-width, and actual phone checks.
- [ ] Verify live collection validators/indexes and repeat startups; finish backup
      evidence and two startups per database for `callingin_dev` and
      `callingin_sprint03_verify`. Earlier validator updates were user-reported.

### Social Battery and requested edits

- [x] Discuss the intended Social Battery behavior, who sees it, and whether it
      is informational or changes contact/messaging behavior. Explain the design
      and obtain approval before implementing.
- [x] Implement and test the agreed Social Battery step if approved.
- [ ] Gather Shorena's other requested changes, explain each proposed edit, and
      make only approved corrections. Do not automatically adopt every deferred idea.
- [ ] Add the additional questions Shorena wants for the November 3 meeting.

### Independent review and closeout

- [ ] Have Claude manually run the repository's
      [quality-review skill](../../.claude/skills/quality-review/SKILL.md) after
      testing and approved edits. Record the exact reviewed commit/scope and
      checks actually completed. Claude has not reviewed Sprint 4 yet.
- [ ] Review findings with Shorena; approve fixes, implement, and verify them.
- [ ] Finish API/setup/current-state documentation, including stale future-feature
      wording in shared documentation as appropriate to the approved workflow.
- [ ] Verify Sprint 4 GitHub Quality for the actual submitted commit; obtain
      approval before new network audits/checks.
- [ ] Run final relevant checks and scratch build after changes; record unresolved
      limitations honestly. Obtain separate Git/merge approval when ready.

The [detailed checklist](sprint-4.md) remains the task-by-task companion to this
progress record. Social Battery behavior was approved and implemented November 3; see the dated update below. AI Coach,
attachments, message editing/deletion, read receipts, and unrelated deferred
product/design features are not implemented by the work recorded here.

## November 3 — Social Battery and automated testing

Shorena approved the explained implementation and local testing scope. Her earlier
color update was separately committed/pushed as `69c3fbe`. This step began with a
clean `sprint-04-conversations` working tree at that commit. No branch switch,
installation, live database operation, Git submission, or merge was performed for
this implementation. Curated memory files were not updated.

### Implemented

- Three playful SVG batteries replace the face concept: full teal **Open to
  Conversations**, partly filled golden yellow **Busy**, low aqua **Taking
  Personal Space**. Labels, native radios, visible focus, and segment counts
  support keyboard use and avoid color-only communication. No external image,
  animation, energy calculation, or people count.
- The account owner explicitly saves a status; it persists in the optional
  `users.socialBattery` field. Existing accounts start Not set, without backfill.
  Only the three supported values can be written, only for the verified owner.
- Accepted conversation partners see availability inside their private room and
  can refresh it manually. Outsiders cannot read it. No email or credentials are
  returned. Status does not block invitations or message sending and has no
  automatic expiry. Other account fields are unchanged.
- Loading/error/success states, reload/retry, preserved selection on failed saves,
  response validation, and explicit sign-in handling are implemented. An owner's
  delayed status expiry does not unmount an open reply; conversation availability
  expiry uses the existing retained-reply flow. Late unmounted responses are ignored.
- Added permanent conversation browser coverage for both invitation lists,
  chronological reading, sending, empty history, older pages, refresh, errors,
  429 responses, UTF-16 boundaries, expiry, keep/discard, invitation draft
  preservation, disabled duplicate sending, stale results after refresh/navigation,
  and late send results after sign-out. Existing invitation tests run alongside it.

[Social Battery behavior, storage, and API reference](social-battery.md).

Main changes: `backend/src/social-battery.js`, route/logging wiring,
`backend/test/social-battery.test.js`, `frontend/src/social-battery/`, account and
conversation integration, browser mock helper, and three new browser suites with
a conversation fixture helper. Sprint documentation is updated locally.

### Verification actually run November 3

| Check                        | Result and scope                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Final backend suite/coverage | **241 passed**, zero failures/skips; **100% lines/functions, 98.34% branches**. New Social Battery module: 100% lines/branches/functions. HTTP/storage behavior uses simulated database methods. |
| Final combined browser suite | **64 Chromium tests passed**, including existing account/invitation tests, new Social Battery tests, and permanent conversation tests. All APIs mocked; axe scans included.                      |
| Static checks                | Repository ESLint and frontend/backend type checks passed.                                                                                                                                       |
| Production build             | Passed into `/tmp/callingin-sprint04-battery-build.f17OnI`; tracked `dist` output unchanged.                                                                                                     |
| Phone-width check            | Automated 390px viewport overflow checks passed. Battery screenshot inspected: stacked readable options and visible selection. This was not an actual phone or human accessibility walkthrough.  |

The first targeted HTTP run could not bind localhost under the sandbox (EPERM).
Its permitted rerun passed. Initial lint findings about component size/complexity
were resolved by splitting rendering helpers; browser-only globals in test
callbacks were made explicit. No lint rules were weakened or dependencies added.
A later UI adjustment avoids falsely showing Not set before a status read succeeds;
the final combined run includes it.

Coverage is execution evidence, not proof of live database behavior. Browser
storage persistence in these tests is mocked; live persistence and any externally
configured users validator still need verification. No frontend coverage
percentage, Safari, VoiceOver, 200% zoom, actual phone, live Atlas, new network
audit, hosted CI result, or Claude independent review is claimed.

### Remaining before Sprint 4 closeout

Use the [updated checklist](sprint-4.md) for real-account invitation/message/battery
checks, live persistence and database startup/backup evidence, outstanding login
and draft checks, human keyboard/VoiceOver/Safari/zoom/phone checks, independent
Claude review, and separately approved Git/merge steps. Shared README/landing-page
future-feature wording remains a documented follow-up. Freemium/Premium and the
AI Coach are future planning; this step adds no subscription or payment behavior.
