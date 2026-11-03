# Sprint 4 — Independent live verification, November 3, 2026

**Timezone:** America/New_York.

**Code checkpoint:** `sprint-04-conversations` at `9eb4bea` plus the local,
uncommitted approved account-navigation and welcome-copy changes. These live
results do not describe an unchanged `9eb4bea` checkout or a main-branch merge.

**Authorization:** Shorena explicitly approved Codex performing the live tests
previously guided with her accounts. Codex used isolated test accounts instead
of changing her accounts or their conversations.

**Result:** **101 live assertions passed; zero failures.** This was a separate
live run, not the mocked Chromium suite or simulated backend tests.

## Environment and evidence

- Existing frontend at `http://127.0.0.1:5173` and backend at
  `http://127.0.0.1:3001`, using the backend's configured MongoDB connection.
- Real HTTP requests and real Chromium pages with separate signed-in browser
  contexts. No `page.route` interception, API mocks, or simulated database methods.
- Three generated accounts named `CX live A 72239c9d`, `CX live B 72239c9d`,
  and `CX live C 72239c9d`, using synthetic `example.invalid` addresses.
- Passwords were randomly generated in process memory. No private `.env` file
  was opened, no credentials/cookies were written to the report, and no database
  settings, validators, indexes, or existing user records were changed directly.
- Temporary harness: `/tmp/callingin-live-verification-20261103.mjs`.
  Result summary: `/tmp/callingin-live-results-72239c9d.json`.
  These scratch paths are not a permanent archive or full transcript.

The normal running application handled all writes. Real database persistence was
observed through fresh requests and browser reload; database metadata and backup
configuration were not inspected directly.

## Confirmed live outcomes

| Area                    | Observed result                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts and sessions   | Three registrations returned 201; API login/current-session checks returned 200. All three accounts also signed in through the real UI in separate browser contexts.                                                                                                                                                 |
| Initial battery         | Each new account returned Not set.                                                                                                                                                                                                                                                                                   |
| Battery writes          | All three owner choices saved and read back. Invalid values and client-supplied account targeting returned 400.                                                                                                                                                                                                      |
| Invitations             | Exact-email lookup found the intended recipient; A's invitation appeared in B's incoming list.                                                                                                                                                                                                                       |
| Duplicate protection    | Repeated A → B and reverse B → A invitations returned 409. A declined pair also continued rejecting repeats with 409.                                                                                                                                                                                                |
| Maybe Later             | B selected Maybe Later in the real UI; sender's list showed deferred. Opening a room before acceptance returned 409.                                                                                                                                                                                                 |
| Acceptance              | B accepted the deferred invitation in the real UI. Trying to change the terminal decision returned 409. A and B opened the same room. Concurrent repeated opens of that existing room returned that same ID.                                                                                                         |
| Personal space          | C selected I need some space in the UI; sender's list showed declined. The declined invitation could not open a room (409).                                                                                                                                                                                          |
| Two-way messaging       | A sent through the real UI and B saw it after Refresh messages; B sent and A saw the reply after refresh.                                                                                                                                                                                                            |
| Partner battery updates | A saved Open, Busy, and Taking Personal Space in the real UI and B saw each through Refresh availability. B saved Busy and A saw it.                                                                                                                                                                                 |
| Reload persistence      | Reloading A's page preserved the saved Taking Personal Space status; reopening the room showed the previously saved messages. This was a page reload, not a backend restart.                                                                                                                                         |
| Account navigation      | Your account offered confirmation for an unsent reply; Keep writing retained it and focused the field. Go to your account required explicit discard before closing and focusing the profile.                                                                                                                         |
| Message boundaries      | 5,000 ASCII UTF-16 units and 2,500 two-unit emoji were accepted (201); 5,001 units, including the emoji boundary case, were rejected (400). A separate 17,000-character JSON request returned 413.                                                                                                                   |
| Content validation      | Invisible-only replies and invitations returned 400. Georgian/Persian/joiner/family-emoji/heart content was accepted and found intact in history. A 5,001-unit invitation returned 400.                                                                                                                              |
| Pagination              | After adding 24 pagination messages, the first page contained 20 with a next cursor. The older page returned 200 with no overlapping IDs; multilingual content remained intact. Load older messages worked in the UI and exposed earlier text.                                                                       |
| Invitation drafts       | Real UI Cancel → Keep writing retained the draft; Cancel → Discard draft cleared it and focused the recipient email field.                                                                                                                                                                                           |
| Revoked session         | Logging out the browser's session through its real API returned 204. Sending from the still-open screen then retained the unsent reply, focused it, and made it read-only. Explicit Sign in again returned to the focused sign-in heading. This tests server-side session invalidation, not natural idle expiration. |
| Sending limit           | Bounded invalid-send probes for isolated account C reached 429; probes returned only 400/429 and stored no messages. Only the dedicated C account was used for these probes.                                                                                                                                         |
| Login failure budget    | Five C credential failures returned 401; a correct login still returned 200. Five further failures using uppercased email returned 401; the next normalized-email attempt returned 429. This confirms a success did not erase earlier failures.                                                                      |
| Automated accessibility | Axe found zero violations in the live conversation screen for the selected WCAG tags. This was not a human screen-reader review.                                                                                                                                                                                     |
| Narrow layout           | At a 390px viewport the live page had no horizontal overflow. This was a browser viewport, not an actual phone.                                                                                                                                                                                                      |

## Outsider and logged-out access — independently confirmed

| Attempt against A–B's room                     | Result |
| ---------------------------------------------- | ------ |
| C reads messages                               | 404    |
| C sends a message                              | 404    |
| C reads partner Social Battery                 | 404    |
| C opens A–B's invitation                       | 404    |
| C changes A–B's invitation response            | 404    |
| Logged-out client reads messages               | 401    |
| Logged-out client sends a message              | 401    |
| Logged-out client reads partner Social Battery | 401    |

C subsequently accepted a separate B–C invitation and opened its own room with B.
That room had a different ID. C still received 404 when reading A–B's original
room. Membership in one conversation did not authorize access to the other.

## Test data and temporary state retained

The three test accounts, their three invitations, two rooms, and generated message
history remain in the configured database for review. No automatic cleanup or
deletions were performed. Generated passwords were not retained for later sign-in.
The dedicated C account was intentionally driven to its sending and failed-login
limits; those temporary counters expire normally. Shorena's own accounts were
not used for those limit probes.

## Remaining limits and checks

- No backend restart, process-restart persistence check, raw Atlas validator/index
  inspection, backup verification, or initial simultaneous room-creation race.
  The concurrent-open check used an already created room.
- No shared-IP 100-attempt saturation on the actively used backend; no
  cross-IP login test. No process-local counter reset certification.
- No 5,000-unit invitation acceptance boundary in this live batch; its 5,001-unit
  rejection and message boundaries were checked. Mocked/simulated coverage remains
  separate.
- No natural session idle expiry or operating-system clipboard-copy certification.
  The real revoked-session response and retained field were checked.
- No independent pending-send navigation test with intentionally slowed real
  traffic; this case passed in the separate mocked navigation regression suite.
- No human keyboard-only walkthrough, VoiceOver, Safari, 200% browser zoom, or
  actual phone certification. No claim that axe replaces those checks.
- No new dependency audit or hosted CI result for the uncommitted navigation work.
  The earlier audit/CI evidence applies to its recorded checkpoints only.

No runtime defect was observed in this live run. Live test results are linked
from the [manual test record](live-manual-testing-2026-11-03.md); automated results
remain identified separately. Sprint closeout and merge still require review of
remaining items and Shorena's explicit merge approval.
