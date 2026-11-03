# Social Battery — Sprint 4

**Implemented locally:** November 3, 2026 (America/New_York).

## Agreed behavior

Social Battery is availability chosen by the account owner. It does not estimate
energy, diagnose mood, count people, or block invitations or messages.

| Stored value | Label                 | Icon                        |
| ------------ | --------------------- | --------------------------- |
| `open`       | Open to Conversations | Full teal battery           |
| `busy`       | Busy                  | Partly filled golden yellow |
| `space`      | Taking Personal Space | Low aqua battery            |
| Absent       | Not set               | No assumed availability     |

The owner selects a labeled radio option and chooses **Save Status**. The saved
status is shown separately from the selection, persists on the account, and stays
until changed. No automatic expiry, animation, or status history is included.
Concurrent saves from different tabs use the last completed database write.

Rounded SVG batteries are drawn in the app, without external images or a new
dependency. Segment counts, written labels, native keyboard controls, and visible
focus mean the interface does not depend on color. Choices stack on narrow screens.

An accepted conversation partner can see the saved status inside their private
conversation. Opening the conversation loads it; **Refresh availability** checks
again. No public profile, recipient lookup, pending invitation, or declined
invitation endpoint exposes it. There are no automatic live updates.

## API and storage

| Method  | Path                                    | Result                           |
| ------- | --------------------------------------- | -------------------------------- |
| `GET`   | `/api/users/me/social-battery`          | Own `{ status }`                 |
| `PATCH` | `/api/users/me/social-battery`          | Save `{ status }`, return same   |
| `GET`   | `/api/conversations/:id/social-battery` | Other participant's `{ status }` |

All routes require an existing, freshly verified signed-in account and return
`Cache-Control: no-store`. Writes use the existing exact-origin and JSON guards.
PATCH accepts exactly one field, `status`, containing `open`, `busy`, or `space`;
additional fields, arbitrary account IDs, and invalid choices are rejected.

Partner reads require membership in the specified conversation. Rooms can only be
opened from accepted invitations through the existing API. Missing rooms and
outsider reads share 404; malformed room IDs return 400. Status responses contain
no email, account credentials, or other profile data. Deleted partners and absent
or invalid stored status values produce `null` (Not set).

The optional `users.socialBattery` string is saved with `$set`; other account
fields are untouched. No new collection, index, dependency, automatic migration,
or Atlas administration command was added. `prepareUsers` currently creates the
email index only. Existing accounts need no backfill. Compatibility with any
externally configured Atlas user validator still needs a live check; a restrictive
validator would need a separately reviewed administrator update.

## Failures and drafts

Read/write failures use safe logging and a 503 response. Invalid server responses
are rejected by the client; an unconfirmed save is not announced as successful.
Failed saves keep the selected choice and the last confirmed saved status.
Initial read failures do not falsely display Not set and offer a reload action.

Expiry in the owner's status panel offers explicit sign-in without immediately
unmounting an open conversation or discarding its reply. Expiry in a conversation's
availability request uses the existing retained-reply/sign-in flow. Other
availability failures leave message controls usable. Late replies to unmounted
status requests are ignored.

## Verification boundaries

Backend tests exercise real Express guards and HTTP with simulated database
methods. Browser tests use mocked APIs in Chromium. These establish local
regression evidence; they do not prove live MongoDB persistence or replace human
keyboard, VoiceOver, Safari, zoom, and actual phone checks.

See the [Sprint 4 progress record](sprint-04-progress.md) for measured results and
the [checklist](sprint-4.md) for remaining live checks and independent review.
