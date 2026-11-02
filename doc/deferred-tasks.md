# CallingIn — Deferred tasks and remaining checks

**Updated:** November 2, 2026 (America/New_York)

This is the central follow-up list for work carried forward from Sprint 3.
Shorena approved creating this document on `main`. Listing a task does not
authorize its implementation: explain WHAT, WHY, HOW, WHERE, IMPACT, and
RECOMMENDATION, then obtain approval for each step.

Sprint 3 is closed for its approved implementation scope with the November 2
merge of `sprint-03-invitations` at `2b9912c` into `main`. Both branches are
retained. The deferred work and explicitly carried live/manual checks below
remain unfinished. Consult the latest dated
[Sprint 3 progress notes](sprint-03/sprint-03-progress.md) for implementation
and merge-verification evidence; earlier pending-state notes are historical.

## Deferred product and design work

### 1. Revisit the color palette

- [ ] Review the overall palette and invitation status colors with Shorena.
- [ ] Agree on a visual preview before changing application styles.
- [ ] Check text contrast and keep readable status words alongside colors.

**Purpose:** Make the interface feel consistent and comfortable to read.
Earlier, Shorena chose to keep the existing colors for the current implementation.
Her latest request adds palette changes back as future work; no new palette has
been selected or approved for implementation. The comparison preview is
`work/visuals/callingin-palette-comparison.html` on `sprint-03-invitations`;
that file is not yet on `main`.

### 2. Envelope icon and emoji

- [ ] Confirm where the missing envelope should appear and reproduce the issue.
- [ ] Agree on which additional emoji or icons belong in the interface.
- [ ] Implement approved visuals and check browser rendering and accessible names.

**Purpose:** Add helpful visual cues without making meaning depend on an icon.
Shorena clarified that the reported missing visual was an envelope. Its intended
location and cause remain unconfirmed. Current invitation status shapes are
separate from this report. No emoji set or icon replacement has been approved.

### 3. Improve displayed messages

- [ ] Review invitation, account, success, error, and empty-state wording together.
- [ ] Agree on clear, friendly wording that matches actual application behavior.
- [ ] Update affected browser assertions when approved wording changes.

**Purpose:** Help people understand what happened and what they can do next.
The sender's Maybe Later label is already implemented as
"Your invitation is still open; please wait." The recipient still sees
"You chose Maybe Later." These completed changes are not pending work.

The requested decline wording, "For now, the recipient needs some space,"
remains pending. Review it alongside the 30-day feature so it does not suggest
that another invitation is currently available when the backend prevents it.

### 4. Clean up unnecessary hyphens and general design text

- [ ] Identify unnecessary hyphens and dashes in user-facing text.
- [ ] Rewrite awkward phrases and review headings, labels, punctuation, and spacing.
- [ ] Confirm the proposed copy and inspect affected layouts before applying it.

**Purpose:** Make the interface read naturally and consistently.
This is a copy and presentation review, not a blanket replacement in code,
URLs, filenames, dates, or technical documentation. Exact changes need review.

### 5. Allow another invitation 30 days after a decline

- [ ] Design and approve the backend/API changes and database migration.
- [ ] Enforce a 30-day wait from the server-recorded decline time.
- [ ] Allow either participant to send a new invitation after that wait,
      preserving earlier invitations as history.
- [ ] Keep pending and Maybe Later invitations from receiving duplicates;
      accepted pairs remain blocked under the current product direction.
- [ ] Return the next permitted date and display an accurate explanation.
- [ ] Test timing boundaries, repeat declines, authorization, simultaneous
      requests, history, pagination, and migration safety.

**Purpose:** Respect a request for space without making it a permanent barrier.
This means **30 days**, not three. The product direction is recorded, but Shorena
explicitly deferred implementation before final Sprint 3 verification.

**Current behavior:** A unique unordered account-pair index permits only one
invitation between two accounts, permanently, including after a decline.
No cooldown or next-permitted date is implemented. The earlier decision remains
final; a future invitation would be a new record. Back up and review the database
before any separately approved migration; no index change is authorized here.

### 6. Google sign-in

- [ ] Plan Google sign-in as a separately approved future feature.
- [ ] Design secure account linking, provider configuration, user feedback,
      and tests before implementation.

**Purpose:** Offer a convenient sign-in option without requiring a new password.
This was previously recorded as future work. It is not part of Sprint 3 closeout
or automatically part of Sprint 4.

### 7. Review deployment protections and the dependency override

- [ ] Revisit the login policy before deployment: ten failures can temporarily
      block a known email across IPs, and the connection ceiling is shared by
      people on the same network. Consider alternative delays or recovery flows
      in a separately approved design; the current limits remain approved.
- [ ] Plan a shared rate-limit store and trusted-proxy settings if deployment
      uses multiple backend processes or a proxy. Do not enable proxy trust blindly.
- [ ] Remove the targeted minimatch 11.0.1 overrides when ESLint and
      @eslint/config-array support a patched compatible dependency range.
      Check the advisory, resolved dependency tree, lint, and all three audits
      before removing them; a newer ESLint version alone is not sufficient.

**Purpose:** Carry the accepted login trade-offs and temporary dependency fix
into deployment planning. These are review findings, not newly approved changes
to the login policy or permission to suppress security checks.

## Remaining verification and closeout work

These are evidence gaps and closeout tasks, not claims that the application failed.
Keep them visible until completed or explicitly accepted as limitations.

**Sprint 4 assignment approved November 2:** Shorena carried the remaining
live/manual login, Cancel draft, message-boundary, and accessibility checks into
Sprint 4. They remain unverified; automated tests do not replace them.

### Required human keyboard-only check in Sprint 4

- [ ] Use Tab, Shift+Tab, Enter, and Space without a mouse through account screens,
      recipient lookup, message composition, Cancel/Keep writing/Discard draft,
      response confirmations, and Show more pagination.
- [ ] Check visible focus and logical order throughout, including error notices
      and session expiry. The retained unsent message should receive focus and
      allow text selection/copying before an explicit Sign in again action.
- [ ] Record browser, tested paths, actual outcomes, and any failures. Pair this
      with the separate VoiceOver, 200% zoom, phone-width, and Safari checks.

The retained-draft automated check now covers focus, Tab/Shift+Tab, and Enter;
this does not complete the human walkthrough or real-session copying check.

### Other remaining evidence and closeout tasks

- [ ] Verify the new login rules with live test accounts after restarting the
      backend: 10 failed attempts per email and 100 total attempts per connection
      in 15 minutes. Successful logins do not consume the email failure allowance.
- [ ] Verify Cancel draft, Keep writing, Discard draft, and focus behavior in
      the running application. Automated mocked-browser tests already passed.
- [ ] Finish or explicitly record limits for live 5,000/5,001-character checks,
      keyboard-only use, 200% zoom, phone-width layout, Safari, and VoiceOver.
- [ ] Confirm recorded database-update evidence for `callingin_dev` and
      `callingin_sprint03_verify`: saved 5,000 rules were user-reported;
      backup evidence and two startups per database remain incomplete. Do not
      claim that a backup or migration check happened without evidence.
- [x] Obtain Claude's independent final Sprint 3 review: report saved on
      `sprint-03-invitations` as `doc/sprint-03/quality-review-2026-11-02-final.md`,
      reviewing `2f916d6`. It found no blocking defects in that snapshot.
- [x] Prepare the approved review fixes and obtain Claude's focused confirmation
      that findings 4 and 5 are resolved. The later approved focus-only fix passed
      targeted tests; all changes still await Git submission.
- [x] Refresh closeout documentation, including the browser accessibility guide.
- [ ] Save an accurate session handoff when requested. Older memory snapshots
      predate Sprint 3 and must not override current code or closeout notes.
- [x] Verify hosted GitHub Quality before the approved merge: both `2b9912c`
      (Sprint 3) and `1c2c40e` (main) passed, independently read from GitHub's API.
- [x] Review completion with Shorena and obtain explicit merge approval.
      Implementation scope is closed with live/manual checks carried into Sprint 4.
- [ ] Confirm the new post-merge GitHub Quality run; parent-commit success is not
      a claim that the new merge commit has already passed its hosted run.

**Latest local checkpoint, November 2:** 36 Chromium browser tests passed after
the approved review fixes, plus lint, type checks, formatting, and a scratch build.
The earlier 176-test backend pass remains the latest backend result; that suite
was not rerun for the frontend/documentation-only fixes. All three npm audits
were freshly rerun and reported zero vulnerabilities. Hosted GitHub status lookup
failed with CLI HTTP 401, so no hosted pass is claimed.
Backend storage was simulated and browser APIs were mocked. This is not proof
of live Atlas behavior, Safari support, or complete accessibility.

**Lookup report:** The earlier asymmetric account lookup issue was not reproduced
or conclusively explained. Shared browser session cookies were one possible
explanation. Shorena requested moving on, and no lookup code changed. Revisit if
it recurs; use separate browser profiles and verify the actual signed-in identity.

**November 2 review follow-up:** Shorena approved correcting stale documentation,
preserving a draft when a lookup finds an expired session, guarding stale Show
more replies after a Sent refresh, and updating this list and the project journey.
The fixes and documentation updates are prepared locally on their respective
branches and await commit/push; the focused follow-up review is now recorded below. No Sprint 3
merge has occurred. Claude's approved Maybe Later wording remains unchanged; review
its punctuation and the possible loading interpretation during the deferred copy
cleanup, rather than changing approved text incidentally.

**Focused review update:** Claude's
`doc/sprint-03/quality-review-2026-11-02-focused-followup.md` on the Sprint 3 branch
confirms draft preservation and stale-pagination findings resolved, with 36
Chromium tests passing. Shorena then approved moving focus to the retained draft;
both targeted expiry tests, lint, and type checks passed after that small fix.
The focused review predates this focus-only change. Reports and changes remain
local pending submission; no new live verification or Sprint 3 merge is claimed.

**Merge checkpoint superseding earlier pending-state notes:** Shorena approved
the Sprint 3 merge on November 2. The combined checkout passed 176 backend tests,
36 Chromium tests, lint, type checks, formatting, scratch build, and all three
audits (zero vulnerabilities). The old CLI authentication failure was worked
around using a public read-only HTTPS request to GitHub's API; no credentials
or authentication settings were changed. Live/manual checks remain carried into
Sprint 4. This file is preserved on main as the central unfinished-work list.

## Tracking updates

Keep this file as the central list on `main`. For each completed item, record
the completion date, relevant commit/report, verification, and remaining limits.
Keep detailed implementation history in the appropriate sprint record. Assigning
these items to Sprint 4 requires a scope decision; they are not automatically
added to its plan.
