# Sprint 03 Progress — Invitations

**Actual setup date:** October 29, 2026 (America/New_York)

**Updated:** October 29, 2026 (America/New_York)

**Branch:** `sprint-03-invitations`

**Starting commit:** `38a9a3c` on merged `main`

**Implementation reviewed through:** `7afcb1e`

**Status:** Planned backend features implemented and pushed. Independent Claude review, live database verification, and frontend invitation work remain. Sprint 3 is not complete or merged.

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
  from the verified session. Messages are trimmed and must have 1–3,000 JavaScript
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
is initially null. Internal pair keys and account credentials are excluded.
Private responses use `Cache-Control: no-store`. Storage failures return safe
503 messages; logs exclude submitted emails, invitation messages, and raw errors.

## Storage and startup

`invitations` documents contain `_id`, `senderId`, `recipientId`, `pairKey`,
`message`, `status`, `createdAt`, `updatedAt`, and `respondedAt`.

Startup creates the collection with strict/error MongoDB JSON Schema validation,
or applies the validator with `collMod` after NamespaceExists. Required fields,
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
Startup needs collection creation/validation/index permissions. Existing invalid
documents are not automatically repaired. No expiry index or seed data was added.
No live Atlas preparation was run in this work.

## Verification evidence and limits

Checks actually run during this implementation:

- Final coverage run after the cookie integration test: **151 tests passed**, zero
  failures/skips; **100% lines, 100% functions, 98.19% branches** across backend source.
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
have not been implemented or verified. Claude review has not yet been invoked.

## Remaining work

- [x] Approve model/API and all three response choices.
- [x] Implement backend protection, storage, lookup, creation, lists, and responses.
- [x] Run automated verification and add real-cookie integration coverage.
- [ ] Independently review the backend with Claude; approve any fixes separately.
- [ ] Plan and approve controlled live Atlas verification using test data.
- [ ] Implement and verify the frontend invitation workflow with approval per step.
- [ ] Complete sprint review and obtain explicit merge approval.

Each Git submission was separately authorized. Latest pushed implementation tip
is `7afcb1e`; nothing from Sprint 3 has been merged into main in this session.
Shared setup/handoff records were committed in `86cf68c`, superseding the earlier
uncommitted/main-checkout descriptions in the historical
[session 002 handoff](../../.codex-memory/sessions/002-sprint-02-closeout-and-sprint-03-handoff.md).
See the [commands and step record](commands_sprint-03.md) for implementation milestones.
