# Sprint 4 — Conversations

**Updated:** November 3, 2026 (America/New_York)

**Branch:** `sprint-04-conversations`

**Current work:** User-guided live/manual testing is in progress. Claude reviewed
`fd0b855`; later approved fixes were checked locally. Sprint closeout remains pending.

See [Sprint 4 progress notes](sprint-04-progress.md) for implementation history,
commits, verification evidence, and the planned testing/editing/review sequence.

See the [November 3 live/manual test record](live-manual-testing-2026-11-03.md)
for Shorena’s reported passes, the corrected duplicate-invitation report, and
remaining checks. Broad live checklist items below stay open where only part of
their scope has been confirmed.

## Completed backend work

- [x] Open or retrieve one participant-only conversation from an accepted
      invitation. Commit: `1da01fa`.
- [x] Send and read private messages, with participant checks on every request.
      Commit: `cedb901`.
- [x] Validate trimmed message text at 1–5,000 JavaScript UTF-16 code units,
      retaining the separate 16 KB JSON request-body limit.
- [x] Paginate history newest first: 20 messages by default, maximum 50,
      with a cursor for older messages.
- [x] Limit sending to 60 attempts per account per minute across conversations.
      Counters are process-local and reset on restart.
- [x] Prepare strict conversation/message validators and indexes at startup;
      mismatched existing validators require an administrator update.

Verification before `cedb901`: 225 backend tests passed, zero failures/skips;
backend coverage was 100% lines/functions and 98.26% branches. Repository lint,
frontend/backend type checks, changed-file formatting, and whitespace checks
passed. Pre-commit checks passed for both commits, and both were pushed.
Database behavior was simulated; this does not certify live Atlas behavior.
GitHub Quality for these Sprint 4 commits has not been checked in this session.

## Conversation screens — approved and built November 2

- [x] Add Open conversation to accepted invitations for either participant.
- [x] Display message history, load older messages, and compose/send replies.
- [x] Add manual Refresh messages to retrieve new replies.
- [x] Preserve the invitation form while viewing a conversation, retain unsent
      replies after errors or session expiry, and confirm before discarding a
      written reply when returning to invitations.
- [x] Add keyboard focus handling, message counts, and responsive layouts using
      the existing interface styles. No new package was installed.

Current UI verification: lint, frontend/backend type checks, changed-file
formatting, whitespace checks, and a scratch frontend build passed. The existing
36 Chromium regression tests passed; two assertions were updated for the new
Open conversation button replacing the old future-feature notice.

A temporary mocked Chromium smoke script exercised opening, reading, sending,
older-history focus, draft confirmation, failed-send recovery, session-expiry
retention, an axe scan, and phone-width overflow. Desktop and phone-width
screenshots were inspected. The script and screenshots are scratch artifacts,
not committed regression coverage or a substitute for human/live testing.
The initial smoke harness needed its browser context setup corrected for axe;
the corrected smoke run passed. No Atlas, human keyboard-only, Safari,
VoiceOver, or actual phone check was performed during this UI work.

These conversation UI changes were committed and pushed as `ccce3c4`. Dedicated
messaging browser regression tests have now been added locally on November 3.
Live/manual checks, Claude review, and GitHub Quality verification remain pending.

**Social Battery is implemented locally with Shorena's November 3 approval.**
Three SVG battery choices (teal/full, golden yellow/partly filled, aqua/low) are
saved explicitly and visible only to accepted conversation partners. Existing
accounts start Not set. Status does not restrict invitations or messages.
See the [behavior and API reference](social-battery.md).

## 2. Browser tests

**November 3 local result:** 64 Chromium tests passed with mocked APIs, including
axe scans. Backend coverage: 241 tests passed, 100% lines/functions, 98.34%
branches, using simulated storage. Lint/type checks and a scratch production build
passed. See the [progress record](sprint-04-progress.md) for scope and limitations.

- [x] Add browser tests for opening an accepted conversation, sending replies,
      reading history, and loading older messages using the new screens.
- [x] Cover message boundaries, empty text, send failures, sending limits,
      expired sessions, and preservation of unsent text as agreed for the UI.
- [x] Cover keyboard focus and interaction, plus automated accessibility scans.
- [x] Run the existing browser regression suite alongside the new tests.
- [x] Record whether APIs are mocked or live and which browsers were tested.
      Automated browser checks do not complete the human walkthrough below.

## 3. Live and human checks

### Messaging and database

- [ ] With separate browser profiles for separate accounts, verify acceptance,
      opening the same room, sending both ways, reading history, and persistence
      after reload/restart against the running backend and Atlas.
- [ ] Verify outsiders and logged-out accounts cannot read or send messages.
- [ ] Verify message history pagination and live 5,000/5,001 UTF-16-unit boundaries;
      distinguish text validation from the separate JSON body-size limit.
- [ ] Verify the 60-attempt message sending limit with dedicated test accounts.
- [ ] Verify conversation/message collection validation, indexes, and repeat
      startup behavior; obtain approval before live database checks or changes.
- [ ] Finish outstanding backup evidence and two startup checks per database
      for `callingin_dev` and `callingin_sprint03_verify`. The earlier 5,000-limit
      validator updates were user-reported; do not claim fresh verification.

### Outstanding account and draft checks carried into Sprint 4

- [ ] After restarting the backend, verify live login limits: 10 credential
      failures per normalized email across IPs and 100 total requests per IP,
      each within 15 minutes. Successful logins do not consume the email failure
      allowance or erase previous credential failures.
- [ ] Verify Cancel, Keep writing, and Discard draft in the running application,
      including focus behavior and cancellation while a send is in progress.
- [ ] Verify retained-draft recovery after real session expiry, including the
      Change person/lookup path, text selection/copying, and explicit sign-in.
- [ ] Finish live invitation 5,000/5,001 UTF-16-unit boundary checks and record
      any independent JSON body-size rejection.

### Required human keyboard-only walkthrough

- [ ] Without a mouse, use Tab, Shift+Tab, Enter, and Space through account
      screens, recipient lookup, composition, Cancel/Keep writing/Discard draft,
      response confirmations, and Show more pagination.
- [ ] Check visible focus and logical order, including errors and session expiry.
      The retained draft should receive focus and allow real text copying before
      the user explicitly chooses Sign in again.
- [ ] Include the implemented conversation screens and messaging controls.
- [ ] Record browser, paths, actual results, and failures. Existing automated
      focus tests do not substitute for this human check.

### Other accessibility and layout checks

- [ ] VoiceOver: names, announcements, reading order, and controls.
- [ ] Safari: account, invitation, and messaging journeys.
- [ ] 200% zoom: readable content and usable controls.
- [ ] Phone-width layout and an actual phone check; record which was performed.

## Social Battery and requested edits

- [x] Implement and locally test the approved Social Battery: explicit save,
      persistent account field, partner-only visibility, no communication blocking,
      keyboard controls, responsive SVG icons, error/expiry handling.
- [ ] Verify Social Battery using real accounts: save/reload/restart, partner
      visibility, outsider rejection, and compatibility with Atlas user validators.

- [x] Discuss Social Battery behavior and visibility, explain the implementation,
      and obtain approval before building it.
- [ ] Gather Shorena's other requested changes and make approved corrections.
- [ ] Add more questions to the November 3 meeting agenda.
- [ ] Complete affected tests before Claude's independent review; approve and
      verify any fixes identified by that review.

## 4. Independent review and closeout

- [ ] Have Claude manually run the repository's
      [quality-review skill](../../.claude/skills/quality-review/SKILL.md)
      against the Sprint 4 changes. This is an independent review, not merely
      another test run; record the reviewed commit and checks actually run.
- [ ] Record findings and obtain approval for fixes, then verify those fixes.
- [ ] Run final relevant backend/browser checks, lint, formatting, type checks,
      and a scratch frontend build without modifying tracked dist output.
- [ ] Ask before new network audits/checks; verify Sprint 4 GitHub Quality and
      record the exact commit and result rather than assuming push means pass.
- [ ] Update Sprint 4/API/setup documentation and distinguish automated,
      simulated, live, user-reported, and human verification evidence.
- [ ] Review any unresolved checks or limitations with Shorena.
- [ ] Obtain separate approval for Git submissions and the final Sprint 4 merge.

Historical note: no Claude review, live checks, new browser tests, or merge was
performed when this checklist was first created on November 2. November 3 local
implementation/testing updates are recorded above and in the progress notes.
The carried verification items are drawn from the existing
[unfinished-checks record](../deferred-tasks.md); original historical records
remain intact. Palette, icons, wording changes, re-invitation policy, and Google
sign-in remain outside this checklist's implementation scope.
