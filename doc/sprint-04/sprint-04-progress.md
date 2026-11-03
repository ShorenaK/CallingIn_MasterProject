# Sprint 4 — Conversations progress

**Recorded:** November 2, 2026. **Last updated:** November 3, 2026 (America/New_York).

**Branch:** `sprint-04-conversations`

**Historical November 2 UI checkpoint:** `ccce3c4`. Later changes are listed below.

**Current status (November 3, closeout preparation):** Implementation and approved
follow-ups were pushed through `9eb4bea`. The approved account-navigation fix,
welcome punctuation change, and detailed live verification are included with this
progress update. The final combined automated run passed **267 backend tests and
79 Chromium tests**; independent live verification passed **101 assertions**.
Claude's review covered `fd0b855`, so it predates the later fixes and UI changes.
Sprint 4 is not merged or declared complete: remaining human, restart/database,
backup, and final-review/CI items are listed in the dated follow-up below.

Evidence is separated into the [user-reported manual record](live-manual-testing-2026-11-03.md)
and [independent live verification](live-verification-2026-11-03.md).
Earlier checkpoints and measurements below are historical.

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

Each listed historical implementation commit was separately approved, committed,
and pushed. Hosted CI evidence is recorded only for the exact checked commit;
see the dated follow-up for the later `828ea32` result.

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

- [x] Have Claude manually run the repository's
      [quality-review skill](../../.claude/skills/quality-review/SKILL.md).
      Reviews cover `fd0b855` and subsequently the complete Sprint 4 source at
      `589032c`; see the dated review records. New follow-up changes are not
      automatically covered by an earlier review.
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

## November 3 — Review follow-ups, UI cleanup, navigation, and live verification

This section supersedes earlier current-state/pending descriptions while retaining
the historical test counts and observations above.

### Approved implementation follow-ups

| Commit/checkpoint         | Work                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `69c3fbe`                 | Teal/yellow/aqua invitation response palette, later personal-space color updated below.                                                                                                       |
| `fd0b855`                 | Social Battery persistence/partner visibility and permanent conversation/browser tests; Claude's reviewed checkpoint.                                                                         |
| `11ee203`                 | Clear first-history loading state on expiry, avoid duplicate conversation expiry announcements, and strengthen the then-current Busy color.                                                   |
| `828ea32`                 | Reject invisible-only invitations/replies in frontend and backend while preserving multilingual text, emoji, and joiners; regression coverage.                                                |
| `44ef40b`                 | Match the approved horizontal mockup: three green/amber/coral battery segments with half-filled Busy, wider cards, and full-width Save Status; pale blush personal-space invitation response. |
| `251ffbc`                 | Remove obsolete Sprint 2/connection panel, frontend health-request code, and panel CSS; link the welcome CTA to the account area; retain review/design references.                            |
| `d581e7d`                 | Simple © 2026 CallingIn footer and user-reported live-test record.                                                                                                                            |
| `9eb4bea`                 | Equal-sized Send invitation/Cancel buttons, aligned desktop row and stacked phone layout, neutral white/teal Cancel; updated manual observations.                                             |
| Included with this update | Welcome comma in place of the dash; guarded account navigation and ten new browser tests; independent live verification and progress documentation.                                           |

Both **Your account** and **Go to your account** now close an empty conversation
and focus the profile. Any unsent reply requires **Keep writing / Discard and go
to account**; Keep writing focuses the retained reply. An in-flight send blocks
account navigation. Existing Back to invitations behavior and separate invitation
drafts remain intact. Navigation requests pass through small frontend hooks;
no routing package, backend permission change, or database migration was added.

Claude's [November 3 review](quality-review-2026-11-03.md) found no blockers at
`fd0b855`. Approved fixes and invisible-only validation were implemented afterward.
The optional query reuse and shared storage-preparation refactors remain deferred.
This was the review status at the navigation checkpoint. Claude subsequently
reviewed the complete `589032c` source, including navigation, in
[the later report](quality-review-2026-11-03-589032c.md). Its approved follow-ups
are recorded below.

### Verification performed after the latest source changes

| Evidence type                        | Actual result                                                                                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simulated backend HTTP/storage tests | **267 passed**, zero failures/skips; **100% lines/functions, 98.35% branches**.                                                                                                                             |
| Mocked-API browser suite             | **79 Chromium tests passed in one combined run**, including ten account-navigation tests and existing account/invitation/conversation/battery tests, with axe scans.                                        |
| Independent live run                 | **101 assertions passed**, zero failures, against the running frontend/backend and configured MongoDB using three isolated accounts. No API mocks or simulated storage.                                     |
| Static checks                        | ESLint, frontend/backend type checks, whole-repository formatting, and whitespace checks passed. Documentation formatting/links were checked after this update.                                             |
| Final scratch production build       | Passed into `/tmp/callingin-account-navigation-final.6ewi1K`; tracked dist unchanged.                                                                                                                       |
| Earlier network checks               | Root, frontend, and backend npm audits reported zero vulnerabilities. GitHub Quality for `828ea32` completed successfully. These are historical checkpoint results, not fresh checks of the new submission. |

[Checked GitHub run for `828ea32`](https://github.com/ShorenaK/CallingIn_MasterProject/actions/runs/41719672211).

The [independent live report](live-verification-2026-11-03.md) records registration,
real browser sign-in, duplicate/reverse invitation rejection, Maybe Later, final
acceptance, personal-space decline, two-way messaging, partner battery changes,
page-reload persistence, pagination, Cancel/Keep writing/Discard, account navigation,
message validation boundaries, revoked-session recovery, and dedicated-account
sending/failed-login limits. Live axe found zero violations; a 390px viewport
showed no horizontal overflow. These do not replace human accessibility checks.

Outsider verification is now independently confirmed: C received 404 for A–B
message read/send, battery read, conversation opening, and invitation response.
Logged-out message/battery requests received 401. C remained unable to read A–B
after accepting a separate B–C room. This resolves the earlier verification gap;
opening C's own room with B was never proof of A–B outsider protection.

The user's earlier duplicate-invitation concern was explicitly corrected by her
and was not a confirmed defect. Live duplicate/reverse attempts returned 409.
No duplicate-protection code or existing records were changed in response to the
initial report.

### Live test data and boundaries

Dedicated batch `72239c9d` left three generated test accounts, three invitations,
two rooms, and generated message history for review. Passwords were generated in
memory and not retained. No user account data, database settings, or schema was
changed directly. The dedicated C account intentionally reached temporary rate
limits. No automatic record deletion or cleanup was performed.

Live checks used the existing configured database through the running app; no
private environment file was opened. No direct database metadata inspection or
backup certification is implied by successful writes. The repeated concurrent
open test used an already created room, not an initial creation race.

### Remaining before closeout/merge

- Backend restart and persistence evidence; raw validator/index/startup checks
  and backup evidence, including the previously listed database-specific items.
- Initial simultaneous room-creation race and the live 5,000-unit invitation
  acceptance boundary. Its 5,001-unit rejection and message boundaries passed.
- Shared-IP 100-request login limit, cross-IP failures, and process-restart/reset
  checks. Only the isolated-account email failure budget was saturated live.
- Natural idle expiry, Change person/lookup expiry recovery, and real OS clipboard
  copying. Server-revoked-session retention/focus/sign-in passed live.
- Human keyboard-only walkthrough, VoiceOver, Safari, 200% zoom, and an actual phone.
- Card/font alignment remains deferred. AI Coach/Freemium/Premium remain future
  planning; no subscription or payment implementation is included.
- Complete the approved findings from Claude's later `589032c` review, verify
  current submitted-commit GitHub Quality, finish documentation cleanup, and obtain
  explicit merge approval. The shared README still needs implementation-status updates when the
  approved merge brings Sprint 4 onto main.

User-reported, automated simulated/mocked, and independently measured live results
remain distinct. Neither coverage nor a green live batch proves every scenario.

## November 3 — Approved follow-up to Claude's `589032c` review

Shorena approved the recommended fixes after Codex read
[Claude's complete Sprint 4 review](quality-review-2026-11-03-589032c.md).
The reviewed application source is `589032c`; subsequent `1304763` added only
memory/journey documentation. Claude's report is preserved as its independent
assessment, not rewritten to claim the follow-up changes were reviewed.

### Implemented follow-ups

- Refresh messages and Load older messages remain focusable during their own
  requests, using `aria-disabled` plus request guards rather than disabling the
  focused button. Repeated refresh activation is ignored while the request is
  pending. A completed history fetch announces **Messages updated.** Failed
  older-page loads retain keyboard focus; successful older pages focus the first
  newly loaded message as before.
- Keep writing now returns focus to the reply for both Back to invitations and
  account navigation. Existing draft/discard behavior remains intact.
- Opening errors 404/409 offer the server explanation and Back to invitations,
  without a Try again action that cannot fix that response. Recoverable opening
  errors still support retry; 401 retains the explicit sign-in flow.
- Added 13 permanent browser regressions for refresh focus/completion/repeated
  activation, failed older loads, 401/404/409 opening, malformed/mismatched room
  responses, late opening results after navigation, 400/404 send failures, and
  Tab/Shift+Tab traversal including confirmation controls.
- Updated the frontend README's obsolete health-panel/feature descriptions and
  test instructions. Corrected current battery colors, historical test-count
  labels, and stale review-pending language in the sprint records.

The request used for Claude's review said Social Battery was unimplemented;
that was an outdated Codex prompt. Actual source and the recorded November 3
approval show it is implemented. The latest review limited its battery reading
to conversation integration because of that prompt; the earlier `fd0b855` review
and existing battery tests remain separate evidence. No product-scope reversal
or additional Social Battery implementation was needed to reconcile this.

### Verification

The two new focus regressions failed before the fixes, reproducing loss of focus
after refresh and a failed older-page load. After the changes, **49 targeted
Chromium tests passed**, including existing conversation/navigation cases and all
13 new review regressions. The subsequent **full combined suite passed all 92
Chromium tests**. These use mocked APIs and include axe scans.

Repository lint, frontend/backend type checks, whole-repository formatting,
whitespace checks, and the scratch production build passed. Output was isolated
at `/private/tmp/callingin-review-fixes-build`; tracked dist was unchanged.
Backend runtime code was not changed, so its latest 267-test result remains the
previous independently recorded review evidence, not a suite rerun for these
frontend/documentation fixes.

No live database check, network audit, hosted GitHub check, human accessibility
walkthrough, new browser engine, or Claude re-review was performed during this
follow-up. Raw-database/startup/backup, remaining login/expiry/clipboard and human
keyboard/VoiceOver/Safari/zoom/actual-phone gaps remain open. Main README cleanup
is still planned with the approved merge workflow; optional database-query reuse
and shared storage-preparation refactors remain deferred. No Git submission or
merge is included in this implementation approval.

## November 3 — Minor polish after Claude's `a4bc652` follow-up

Claude's [focused follow-up](quality-review-2026-11-03-a4bc652.md) confirmed the
previous fixes, independently passed 267 backend and 92 mocked Chromium tests,
and found no blockers. Its three remaining low/very-low suggestions were approved
by Shorena and implemented locally:

- Busy `aria-disabled` buttons now share the faded/wait styling of disabled
  buttons, and hover rules exclude them. They remain keyboard-focusable;
  request guards continue to ignore repeat activation.
- The initial successful history request announces **Messages loaded.** Subsequent
  refresh/retry requests announce **Messages updated.**
- The frontend README scratch-build command includes `--emptyOutDir`.

The existing focus regression now checks initial/refresh wording, busy cursor and
opacity, and unchanged background on hover. A small older-page state helper keeps
the history hook within the existing function-length limit without changing page
ordering or request guards. No lint rule was weakened. The final focused run
passed **28 Chromium review/resilience tests**, including the extended styling
and announcement assertions; APIs were mocked and axe scans included.

Lint, frontend/backend type checks, whole-repository formatting, whitespace and
scratch build passed. Build output used
`/private/tmp/callingin-minor-review-build.K4JkDx`; tracked dist was unchanged.
The earlier combined 92-browser result and Claude's 267-backend rerun remain
separate from this minor follow-up. No new live, network, human-accessibility,
backend-suite, or hosted CI check was performed here. These three edits have not
received another independent Claude review. No commit/push/merge was performed
as part of the implementation approval.

## November 3 — Approved integration into main

After the full and focused Claude reviews and the approved follow-up fixes,
Shorena explicitly requested merging Sprint 4. This is approval to integrate the
implemented work; the unverified live/manual items above remain open and are not
marked as passed. The Sprint 4 branch is retained.

Merge parents: main `a8fd2a9` and Sprint 4 `61184fc`. Both clean checkouts matched
freshly fetched origin references. GitHub Quality was independently confirmed
successful for both parents. The non-fast-forward merge prepared without
conflicts and preserved main's shared design references and curated memory.

Before completing the merge, the runtime source, tests, package manifests and
workflow in the prepared main tree were confirmed identical to the tested Sprint 4
checkout. Final local verification therefore used that existing checkout and its
installed dependencies; no installation or private database connection was needed.
Backend coverage passed **267 tests**, zero failures/skips, **100% lines/functions,
98.35% branches**. The full combined browser suite passed **92 Chromium tests**,
with mocked APIs and axe scans. Lint, frontend/backend type checks and a scratch
production build passed; build output was isolated at
`/private/tmp/callingin-sprint04-merge-build.slgljY` and tracked dist was preserved.

Main's README now reflects implemented private messaging and Social Battery,
the removed welcome health panel, and current automated-test scope. Detailed
remaining live/human/database checks stay in this sprint's checklist. No new
live verification or manual accessibility certification is claimed by the merge.
The new post-merge hosted run needs its own result; passing parents do not
establish that a future merge run passed.
