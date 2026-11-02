# Sprint 4 — Conversations

**Updated:** November 2, 2026 (America/New_York)

**Branch:** `sprint-04-conversations`

**Next review/testing session:** November 3, 2026 (tomorrow)

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

## Remaining implementation

- [ ] Propose and obtain approval for conversation screens: open a conversation,
      display message history, load older messages, compose/send replies, and
      handle loading, errors, and expired sessions with accessible focus.

Conversation screens are not implemented yet. Browser messaging tests and the
full manual UI journey depend on this work. The request to postpone checks does
not itself approve frontend implementation.

**Social Battery remains undecided.** Do not implement it without a separate
scope decision and approval. Other deferred product/design ideas are not
implicitly included in this sprint.

## Tomorrow — 2. Browser tests

- [ ] Add browser tests for opening an accepted conversation, sending replies,
      reading history, and loading older messages once the screens exist.
- [ ] Cover message boundaries, empty text, send failures, sending limits,
      expired sessions, and preservation of unsent text as agreed for the UI.
- [ ] Cover keyboard focus and interaction, plus automated accessibility scans.
- [ ] Run the existing browser regression suite alongside the new tests.
- [ ] Record whether APIs are mocked or live and which browsers were tested.
      Automated browser checks do not complete the human walkthrough below.

## Tomorrow — 3. Live and human checks

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
- [ ] Include the conversation screens and messaging controls once implemented.
- [ ] Record browser, paths, actual results, and failures. Existing automated
      focus tests do not substitute for this human check.

### Other accessibility and layout checks

- [ ] VoiceOver: names, announcements, reading order, and controls.
- [ ] Safari: account, invitation, and messaging journeys.
- [ ] 200% zoom: readable content and usable controls.
- [ ] Phone-width layout and an actual phone check; record which was performed.

## Tomorrow — 4. Independent review and closeout

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

No Claude review, live checks, new browser tests, or merge was performed while
creating this checklist. Items 2–4 are planned for tomorrow, not marked complete.
The carried verification items are drawn from the existing
[unfinished-checks record](../deferred-tasks.md); original historical records
remain intact. Palette, icons, wording changes, re-invitation policy, and Google
sign-in remain outside this checklist's implementation scope.
