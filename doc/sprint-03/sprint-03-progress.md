# Sprint 03 Progress — Invitations

**Actual setup date:** October 29, 2026 (America/New_York)

**Updated:** October 30, 2026 (America/New_York)

**Branch:** `sprint-03-invitations`

**Starting commit:** `38a9a3c` on merged `main`

**Latest implementation/test tip:** `911443d`

**Independent review scope:** Initial `38a9a3c..7afcb1e`; focused follow-up through `20ad1ba`, saved in `326203e`

**Status:** Planned backend features implemented and pushed. Initial and focused Claude reviews completed. Planned manual Atlas checks were user-reported successful; remaining review follow-ups and frontend invitation work remain. Sprint 3 is not complete or merged.

## Goal and scope

Add authenticated recipient lookup, invitation creation, incoming/outgoing lists,
all three recipient choices, authorization checks, and meaningful tests.
Original calendar targets in the semester plan are historical; revised deadlines
need advisor agreement. AI drafting, notifications, email delivery, and private
messaging are outside this backend implementation.

## Approved behavior

- Existing accounts are found by exact normalized email after sign-in. Lookup
  returns only account ID and display name. It reveals whether an exact email is
  registered; this privacy tradeoff was explicitly approved. Missing recipients
  and self-lookups return the same 404 response.
- Invitation creation accepts only `recipientId` and `message`. The sender comes
  from the verified session. Messages are trimmed and must have 1–5,000 JavaScript
  string code units. Sent messages cannot be edited through this API.
- Self-invitations are rejected. One invitation is permitted per unordered account
  pair, including after acceptance or decline. A reverse invitation is a duplicate,
  not acceptance. Reopening contact requires a separate future policy decision.
- Only participants can list their invitations; only the recipient can respond.
- Creation and exact-email lookup each allow 10 attempts per verified account per
  15 minutes, with independent counters. Successful and failed attempts count.
  Counters are process-local, reset on restart, and require a shared store before
  relying on this protection across multiple backend processes.

| Recipient choice  | Stored status | Behavior                                              |
| ----------------- | ------------- | ----------------------------------------------------- |
| Newly created     | `pending`     | Recipient may choose any response                     |
| Maybe Later       | `deferred`    | Recipient may later accept or decline                 |
| Accept            | `accepted`    | Final consent recorded; messaging belongs to Sprint 4 |
| I need some space | `declined`    | Final closure without a conversation                  |

Repeating the current response returns it unchanged, including timestamps.
Changing a final response returns 409. A missing invitation and one not addressed
to the signed-in recipient both return 404. Conditional database updates include
recipient identity and allowed prior status. Acceptance does not yet create a
conversation; Sprint 4 can use the accepted invitation ID as its handoff reference.

## API contract

All routes require a valid cookie session and an existing account. Writes require
an exact trusted Origin and JSON content type. Identity is checked server-side;
client-supplied account IDs never determine the sender or list owner.

| Method | Path                                  | Input / result                                                          |
| ------ | ------------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/users/lookup`                   | `{ email }` → `{ user: { id, displayName } }`                           |
| POST   | `/api/invitations`                    | `{ recipientId, message }` → 201 `{ invitation }`; duplicate pair → 409 |
| GET    | `/api/invitations?direction=incoming` | Received invitations                                                    |
| GET    | `/api/invitations?direction=outgoing` | Sent invitations                                                        |
| PATCH  | `/api/invitations/:id/response`       | `{ status: 'accepted' \| 'deferred' \| 'declined' }` → `{ invitation }` |

Lists include all statuses, newest first by `createdAt` then `_id`. Optional
`limit` defaults to 20 and is restricted to 1–50. Optional `cursor` is the previous
page's `nextCursor`; clients should URL-encode it. Responses are
`{ invitations, nextCursor }`, with `null` when no further page exists. Invalid,
repeated, or unknown query parameters are rejected. A cursor is a position, not
an authorization token; participant identity is always included in the query.

Public invitation fields are `id`, `senderId`, `recipientId`, `message`, `status`,
`createdAt`, `updatedAt`, and `respondedAt`. Dates are ISO strings; `respondedAt`
is initially null. List entries additionally include `otherPerson: { displayName }`,
or `null` if the counterpart account is unavailable. Creation/response payloads
retain the original invitation shape. Internal pair keys and account credentials are excluded.
Private responses use `Cache-Control: no-store`. Storage failures return safe
503 messages; logs exclude submitted emails, invitation messages, and raw errors.

## Storage and startup

`invitations` documents contain `_id`, `senderId`, `recipientId`, `pairKey`,
`message`, `status`, `createdAt`, `updatedAt`, and `respondedAt`.

Startup inspects the existing collection validation. Matching rules permit startup
without collection creation or `collMod`; a missing collection is created with
strict/error MongoDB JSON Schema validation. A concurrent creation is handled by
verifying the winning collection. Different or missing validation stops startup
and requires an explicit administrator update. No automatic `collMod` is run. Required fields,
BSON types, allowed statuses, nonblank bounded messages, and rejection of extra
fields are specified. The API separately enforces identity, self-invitation,
pair-key construction, trimming, and legal response transitions. The validator
is not a replacement for those business rules. MongoDB string-length validation
and JavaScript code-unit counting are not identical for all Unicode text.

Indexes:

- Unique `{ pairKey: 1 }` for permanent pair uniqueness.
- `{ recipientId: 1, createdAt: -1, _id: -1 }` for incoming pagination.
- `{ senderId: 1, createdAt: -1, _id: -1 }` for outgoing pagination.

Preparation runs after account indexes and before authentication/HTTP serving.
Failures close the database connection and stop startup with a safe error.
Startup needs collection inspection and index permissions, plus collection creation
permission when missing. Validator changes require a separate administrative action. Existing invalid
documents are not automatically repaired. No expiry index or seed data was added.
Live test preparation and restart checks were subsequently performed by Shorena on
October 29–30; see the dated live report below.

## Verification evidence and limits

Checks actually run during this implementation:

- Latest coverage run after the approved review fixes: **158 tests passed**, zero
  failures/skips; **100% lines, 100% functions, 98.27% branches** across backend source.
  The earlier cookie integration baseline was 151 tests and 98.19% branches.
- The preceding full verification passed frontend/backend lint, repository-wide
  formatting, frontend/backend type checks, and a frontend production build in
  `/private/tmp/callingin-sprint03-verification-build`, preserving tracked dist files.
- After the test-only addition, backend lint, project type checks, changed-file
  formatting, and whitespace checks passed. Pre-commit lint/format checks passed.
- Real startup, Express, express-session, and connect-mongo were exercised with
  simulated database methods. The cookie workflow covers login, lookup, creation,
  sent/received lists, outsider/sender rejection, Maybe Later then acceptance,
  repeated acceptance, logout, and old-cookie rejection across invitation routes.
- Focused tests cover input validation, limits, pair conflicts, pagination, all
  response transitions, authorization, safe failures, and simulated concurrent
  creation/final-response conflicts.

Coverage measures execution, not correctness. Database fakes do not certify real
MongoDB schema rejection, unique-index races, atomicity, persistence, permissions,
or query plans. Live Atlas checks remain pending. No private `.env` was opened,
no network audits were run, and hosted GitHub Quality results were not independently
verified in this session. Frontend invitation behavior and browser accessibility
have not been implemented or verified. Claude independently reported 151 passing
tests and passing lint, formatting, types, and scratch build for the initial review;
that evidence predates the fixes below.

## Independent review and approved follow-up

The [original Claude review](quality-review-2026-10-29.md) is preserved as a historical
snapshot, not a review of subsequent fixes. It found no confirmed code defect,
flagged a conditional startup-permission risk, and identified test gaps.

Approved follow-up, implemented and pushed:

- `c8c3d32`: verify existing validation without `collMod`, fail safely on mismatch,
  and test matching/default settings, missing collections, inspection failures,
  mismatches, and concurrent creation. The safe startup error now mentions the
  administrative update requirement. Actual read/write-only Atlas restart behavior
  was subsequently reported successful by Shorena; roles were not independently inspected.
- `911443d`: assert returned retry timestamps remain unchanged; paginate across
  different dates with older records having higher IDs; test 1,500 emoji accepted,
  1,501 rejected, Unicode whitespace-only rejection, and Unicode trimming.
- Latest checks: 158 tests passed with coverage as above; backend lint, project
  type checks, changed-file formatting, and whitespace checks passed. Pre-commit
  lint/format checks passed for both commits. These checks were run before this
  documentation update; they were not rerun just to edit Markdown.

The focused Claude re-review completed with no regressions found. It identified two
additional explicit validator test cases and missing administrator-update instructions.
These remain pending. Real-database checks and their limits are recorded below.
An opt-in real-database test suite has not been added or approved. Optional startup
logging diagnostics remain deferred; the safe error was clarified, but allowlisted
startup logging was not added. `respondedAt` continues to mean the latest response;
preserving the original deferral time would need a product decision. User-facing
"characters" wording still uses JavaScript code-unit limits; frontend wording and
counter behavior need consideration during interface work. The code-fix stage did not
change Atlas; Shorena subsequently configured the isolated live test environment.

## October 29–30 — User-operated live Atlas checks

See the [detailed live verification report](live-atlas-verification-2026-10-30.md)
for the purpose of each test, database-user versus app-account explanations,
reported evidence, the corrected duplicate request, and remaining limits.

Shorena reported successful restricted-user startup and restart, expected
collections/indexes/validation, account registration/sign-in, recipient lookup,
invitation flow, outsider rejection, Maybe Later then acceptance, final-state
conflict, persistence, duplicate 409, decline, stable retry times, and database
rejection of missing required fields. Codex guided the steps and read pasted
outputs; it did not independently operate Atlas or inspect credentials/roles.
The exact rejected document and full outgoing-list response were not retained;
the report avoids claiming more than the available evidence supports.

Live simultaneous-request behavior, pagination query plans/load, every individual
schema constraint, and the invitation UI remain unverified. This documentation
update ran no application suites or live checks. Latest automated evidence remains
158 passing tests, 100% lines/functions, and 98.27% branches.

## Remaining work

- [x] Approve model/API and all three response choices.
- [x] Implement backend protection, storage, lookup, creation, lists, and responses.
- [x] Run automated verification and add real-cookie integration coverage.
- [x] Complete initial independent Claude review and approve the selected fixes.
- [x] Obtain focused Claude re-review of the startup fix and regression tests.
- [x] Guide planned manual Atlas checks and record user-reported results/limits.
- [x] Add missing/weaker-validator tests and administrator-update instructions.
- [ ] Restore original development connection settings privately after testing.
- [ ] Implement and verify the frontend invitation workflow with approval per step.
- [ ] Complete sprint review and obtain explicit merge approval.

Each Git submission was separately authorized. Latest pushed implementation tip
is `911443d`; nothing from Sprint 3 has been merged into main in this session.
Shared setup/handoff records were committed in `86cf68c`, superseding the earlier
uncommitted/main-checkout descriptions in the historical
[session 002 handoff](../../.codex-memory/sessions/002-sprint-02-closeout-and-sprint-03-handoff.md).
See the [commands and step record](commands_sprint-03.md) for implementation milestones.

## October 30 — Approved password policy change

Shorena explicitly approved lowering the shared minimum from 15 to 8 characters,
keeping the 128-character maximum, and rejecting new passwords that contain the
account's full normalized email address, ignoring case. Passwords themselves are
not trimmed or normalized for hashing. No letter/number requirement was added.
This is a deliberate usability tradeoff below current NIST password-only length
guidance, not a claim of equivalent strength.

Registration enforces the email rule server-side and gives matching form guidance.
Sign-in uses the new length bounds but does not apply the new email restriction
to existing credentials. Existing hashes/accounts need no migration. Google sign-in
is documented in README as future work, not implemented or approved for this sprint.
The historical live test report correctly retains the 15-character rule in force
when those accounts were created. No private settings or Atlas data were changed.
Verification after this change: **161 backend tests passed**, zero failures/skips;
**100% lines/functions and 98.29% branches**. Tests cover 7/8/128/129 length
boundaries, successful eight-character registration/hash verification, rejection
of the full email inside a password with case variation, allowed email-local-part
text, and continued verification of existing passwords containing an email.
Repository lint/formatting, frontend/backend type checks, scratch frontend build
(`/private/tmp/callingin-password-policy-build`), and whitespace checks passed.
Browser validation messages, layout, and accessibility still need manual review.
Claude's previous review predates this policy change. No new live Atlas check or
Git submission was performed for this change.

### October 30 — Superseding registration limits and visible rules

Shorena subsequently approved **8–18 characters**, no whitespace (including spaces,
tabs, and line breaks), and the existing full-email exclusion for new accounts.
The registration form displays all four rules below the password field, linked
as its accessible description. Client and server reject invalid new passwords;
passwords are never silently stripped of spaces. This supersedes the earlier
8–128/spaces-allowed registration policy above. Sign-in and hash verification
retain 8–128 support, including whitespace, for existing accounts. No stored hash
migration or database changes are needed. Google sign-in remains future work.
Verification: **162 backend tests passed**, zero failures/skips; **100% lines/functions,
98.30% branches**. Tests cover new registration bounds, whitespace rejection,
case-insensitive full-email exclusion, and existing 19–128-character/space-containing
password verification. Repository lint/formatting, frontend/backend type checks,
scratch frontend build, and whitespace checks passed. Two test fixtures were
corrected for the new limit and the existing registration attempt quota; no rate
limit was weakened. Browser guidance/layout still needs manual review. No Atlas
access, private settings change, or Git submission occurred for this update.

### October 30 — Remaining validator review items

The two explicit regression cases were added and pushed in `f90da8d`: an existing
collection with no validator and one permitting 5,000-character messages must both
fail before index work or automatic administrative updates. All **11 storage tests**,
focused lint, formatting, and whitespace checks passed for that test-only change.
The full application suite was not rerun for those two cases; the prior full
baseline remains 162 passing tests.

The approved [administrator repair guide](invitation-validator-admin-guide.md)
now explains target confirmation, private backup, existing-data checks, deliberate
validator update, and restart with the limited application account. Its commands
are documentation only: no Atlas update, backup, tool installation, or credentials
inspection was performed. The guide is dated and must be compared with current
source before use. This closes the two test cases and missing-instructions items
from Claude's follow-up; Claude has not yet reviewed the subsequent password changes.

### October 30 — Approved browser and accessibility tooling

Shorena approved Playwright, axe-core integration, Chromium downloads, and CI
browser checks before the invitation frontend handoff. This supersedes the earlier
accessibility-tooling deferral without implying professor approval.

Added a separate root `test:e2e` command, isolated Vite server on port 4175, three
Chromium account-screen tests, axe scans, lint coverage for the new test/config
files, ignored reports, and Quality workflow browser installation/execution.
All API calls use explicit mock responses; no backend or Atlas connection is
required. Existing app source and Claude's pending password review were untouched.

Local run: **3 browser tests passed**; **164 backend tests passed**. Repository
lint/formatting, existing app type checks, and whitespace checks passed. axe reported no violations under the selected
WCAG tags on sign-in, registration, and profile views. Keyboard field order/focus
outline, password rules/errors, mock sign-in, and sign-out were exercised. This
is not full accessibility certification or real-session integration. Manual
screen-reader, zoom/reflow, visible focus, and other-browser checks remain.
See [browser/accessibility testing](browser-accessibility-testing.md) for commands,
scope, reports, CI behavior, and frontend handoff guidance. Hosted CI remains
unverified; tooling changes are not permission to submit Git or merge the sprint.

### October 30 — Other participant display names in lists

Approved backend addition: each listed invitation now includes
`otherPerson: { displayName }`, or `otherPerson: null` when that account is missing.
Incoming lists resolve the sender; outgoing lists resolve the recipient. Names
are current profile values, not stored invitation snapshots or verified identity.
The frontend can show “From Sarah” / “To Michael” and “Account unavailable” when
missing. This prevents asking recipients to decide without a sender label.

Only after fetching the authorized, paginated invitation page does the backend
collect counterpart IDs and issue one deduplicated user query selecting `_id` and
`displayName` only. Empty pages skip it. Names from lookahead records, unrelated
accounts, emails, and password hashes are not returned. Failure of this lookup
fails the list safely with 503. No endpoint, schema, index, stored record, or
creation/response payload changed. Claude owns the frontend implementation;
this backend response addition does not authorize concurrent frontend edits here.
Verification: **168 backend tests passed**, zero failures/skips; **100% lines/functions,
98.35% branches**. Tests cover both directions, single/deduplicated lookups,
minimal field projection, missing accounts, empty pages, lookup failure, current
names after refresh, and real-cookie workflow integration with simulated storage.
Repository lint/formatting, existing application type checks, and whitespace checks
passed. No live Atlas operation was performed. Independent review and frontend
integration remain separate steps; no Git submission occurred in this update.

### October 30 — Invitation frontend step 1 (Claude implementation)

Claude implemented the approved first frontend step in `2dadde5`; Codex reviewed it.
Signed-in users now see an Invitations area with **Received** and **Sent** lists
(first 10 of each). Read-only cards show “From/To {name}” from `otherPerson`, or
“Account unavailable”, plus the message (line breaks kept), sent date, and a status
label pairing a shape with words (● waiting, ◐ Maybe Later, ✓ accepted, ○ I need
some space), so status is not shown by color alone. Accepted cards state that
private conversations are future work. Loading, empty, and calm amber retryable
problem states are included; red is not used on invitation screens. Shorena chose
the current label colors after reviewing previews; icon and alternative color
previews were not applied. A 401 from invitation requests returns to sign-in with
“Your session has ended. Please sign in again.” and moves focus to the heading.
Account requests now share one JSON request helper with invitations.

Codex found that any `createdAt` string passed validation, so a malformed date
threw while rendering and blanked the page. Fixed in `29dab81`: only exact ISO
dates are accepted; otherwise the list shows the retryable notice. Its browser
test failed before the fix (`RangeError: Invalid time value`) and passes after.

Checks Claude ran after the fix: repository lint, formatting, frontend/backend type
checks, **168 backend tests** (100% lines/functions, 98.35% branches), a scratch
frontend build, and **12 Playwright tests** with axe scans and no violations,
all using mocked APIs. Shorena reported viewing the outsider account's received
invitation in the running app. Not verified: screen reader, zoom/reflow, Safari/
Firefox, or step 1 against live Atlas.

**For Codex re-review:** range `824a02b..29dab81`, frontend only. Check list-shape
validation including dates, that session expiry cannot loop (`expire` is a stable
callback), unchanged account behavior after the request-helper refactor, and the
h2/h3/h4 heading order. Pending steps, each approved separately: Show more
pagination, recipient responses with final-choice confirmation, lookup and sending
with a 3,000-code-unit counter, then status copy, docs, and final checks. Sprint 3
is not complete.

### October 30 — Approved invitation limit increase to 5,000

Shorena approved increasing invitation messages from 3,000 to **5,000 JavaScript
code units after trimming**. The shared backend limit, creation error, schema
preparation, boundary/emoji tests, and administrator guide now reflect 5,000.
Historical test/review notes above describe the former limit. The weaker-validator
regression now uses 6,000 as the incorrect maximum.

Existing Atlas collections still enforcing 3,000 do not automatically change.
The new startup check will reject that mismatch until an administrator explicitly
applies the reviewed 5,000 validator. The update needs separate approval and the
[administrator guide](invitation-validator-admin-guide.md); no Atlas command was
run here. An already running old backend must also be restarted after the approved
migration. Claude's sending form/counter must use 5,000; no frontend sender was
added by this backend change. The existing 16 KB JSON body-size guard remains;
requests exceeding it return 413 even if the message length alone is valid.
Verification: **169 backend tests passed**, zero failures/skips; **100% lines/functions,
98.35% branches**. Tests cover 5,000 accepted, 5,001 rejected, emoji/code-unit
boundaries, whitespace, the 5,000 schema value, rejection of a weaker 6,000 rule,
and rejection of the old 3,000 validator until explicit migration. Repository lint,
formatting, existing app type checks, and whitespace checks passed. No frontend
or live database verification was claimed for this backend-only update.

### Tomorrow's checklist — October 31, 2026 (America/New_York)

Shorena explicitly deferred the live 5,000-character database-rule update until
tomorrow, alongside final verification work. No Atlas rule was changed today.
The 5,000 backend changes and related documentation remain uncommitted at this
checkpoint; Git submission requires a separate request.

- [ ] Confirm the exact cluster and database names before any live action. Test:
      `callingin_sprint03_verify`. Development name remains to be confirmed:
      `callingin_dev` versus `calling_dev`; do not guess from historical notes.
- [ ] Follow the [administrator guide](invitation-validator-admin-guide.md) for
      each existing target: confirm approval/maintenance scope, stop writers,
      back up data and validation settings privately, and check existing records.
- [ ] Deliberately update invitation validation from 3,000 to 5,000, preserving
      the other expected rules and strict/error settings. Read back and verify.
      No deletion, permission expansion, or automatic migration is authorized by
      this checklist alone.
- [ ] Restart the backend twice against each approved target with its regular
      limited application account. Verify successful startup and the new limit
      using approved test data. Keep credentials out of chat, reports, and Git.
- [ ] Coordinate Claude's sending form/counter with the 5,000 backend contract.
      Until migration, mocked frontend tests can continue; do not restart the new
      backend against an old 3,000 validator and expect startup to succeed.
- [ ] Finish the full browser/backend verification and guided human desktop,
      mobile, keyboard, zoom/reflow, and accessibility checks. Record actual runs
      and limits; earlier results do not certify later changes.
- [ ] Complete independent review and update sprint documentation/handoff. Restore
      the intended development configuration privately after isolated tests.
- [ ] Review Sprint 3 completion with Shorena. Commit/push and any merge into main
      require explicit authorization; do not mark the sprint complete prematurely.

Before each step, explain what it does, why, Shorena's action, and the expected
result in short everyday language, using a simple life analogy where helpful.
Proceed one approved step at a time. This is a to-do record, not proof that backup,
migration, verification, or a full transcript archive has occurred.
