# CallingIn — Deferred tasks and remaining checks

**Updated:** November 2, 2026 (America/New_York)

This is the central follow-up list for work carried forward from Sprint 3.
Shorena approved creating this document on `main`. Listing a task does not
authorize its implementation: explain WHAT, WHY, HOW, WHERE, IMPACT, and
RECOMMENDATION, then obtain approval for each step.

The Sprint 3 implementation currently lives on `sprint-03-invitations`, last
checked at `2f916d6`; it has not been merged into `main`. Behavior described
below refers to that implementation, not the older application on `main`.
Consult the latest dated entries in the
[Sprint 3 progress notes](sprint-03/sprint-03-progress.md) on that branch for
implementation evidence. The inherited copy on `main` may be older until merge.

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

## Remaining verification and closeout work

These are evidence gaps and closeout tasks, not claims that the application failed.
Keep them visible until completed or explicitly accepted as limitations.

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
- [ ] Obtain Claude's independent final Sprint 3 review and address findings
      through separately approved changes.
- [ ] Refresh closeout documentation, including the browser accessibility guide,
      and save an accurate session handoff. Older memory snapshots predate Sprint 3.
- [ ] Check the hosted GitHub Quality result before an approved merge.
- [ ] Review completion with Shorena; Git submissions and merge require explicit
      authorization. Do not label Sprint 3 complete solely because local tests pass.

**Latest local checkpoint, November 2:** 176 backend tests and 31 Chromium
browser tests passed, plus lint, type checks, formatting, and a scratch build.
Backend storage was simulated and browser APIs were mocked. This is not proof
of live Atlas behavior, Safari support, or complete accessibility.

**Lookup report:** The earlier asymmetric account lookup issue was not reproduced
or conclusively explained. Shared browser session cookies were one possible
explanation. Shorena requested moving on, and no lookup code changed. Revisit if
it recurs; use separate browser profiles and verify the actual signed-in identity.

## Tracking updates

Keep this file as the central list on `main`. For each completed item, record
the completion date, relevant commit/report, verification, and remaining limits.
Keep detailed implementation history in the appropriate sprint record. Assigning
these items to Sprint 4 requires a scope decision; they are not automatically
added to its plan.
