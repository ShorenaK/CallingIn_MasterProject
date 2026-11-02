# Sprint 3 — Live Atlas verification, October 29–30, 2026

**Recorded:** October 30, 2026 (America/New_York)

**Branch at documentation update:** `sprint-03-invitations`, `326203e`

**Evidence:** Shorena performed the browser/terminal/Atlas steps and reported results
in chat; Codex supplied instructions and interpreted the reported output. Codex did
not operate Atlas, inspect private settings, or independently observe the entire run.
These are manual live results, separate from the automated simulated-storage tests.

## What we were testing and why

We tested real CallingIn backend requests against a separate Atlas database,
`callingin_sprint03_verify`. The invitation interface is not built yet, so browser
console requests stood in for its future buttons. Like testing the plumbing before
installing the taps, this checks the backend and stored data, not the finished UI.
The existing account interface was used to register and sign in.

Two kinds of user were involved:

- **Atlas database user:** the backend's connection identity, like a key to the
  database room. Shorena reported creating a dedicated test user with `readWrite`
  access to the test database and no extra roles. This differs from an administrator
  identity that can manage database settings. Actual role assignments were not
  independently inspected by Codex.
- **CallingIn accounts:** sender, recipient, and outsider records in the `users`
  collection. These represent people using the app, not Atlas database operators.
  Their permissions are enforced by the backend session and invitation ownership.

Shorena privately changed the active backend connection and database name for this
exercise, preserving the original development settings as comments. Credentials
and connection strings were not shared or recorded. Tests were intended for the
separate database; Codex did not read `.env` to certify its contents. No development
or test database was deleted. Restoration of the original settings remains pending.

## Claude's contribution

The [initial Claude review](quality-review-2026-10-29.md) identified a restart risk:
startup attempted `collMod`, which needs privileges beyond a basic read/write role.
Codex implemented the separately approved fix in `c8c3d32`: inspect and accept matching
validation; create when absent; fail safely on mismatch; never automatically change
existing validation. This is like checking that a lock matches the key instead of
replacing the lock every time the door is opened.

The [focused Claude re-review](quality-review-2026-10-29-followup.md) found no
regressions, confirmed the selected fixes/test improvements, and independently
reported 158 passing tests, 100% line/function coverage, and 98.27% branch coverage.
It asked for a live second-start check because fakes cannot establish how Atlas
returns stored validation. That check was part of this manual exercise. Neither
review is evidence that Claude performed live Atlas checks.

## Test accounts and records

Disposable means made-up accounts used for testing, not automatically deleted.
No real password or personal profile details were needed.

| Role in testing                                                       | Display name      | Test email                           |
| --------------------------------------------------------------------- | ----------------- | ------------------------------------ |
| Sender                                                                | Sprint3           | `sender_sprint3_test@example.com`    |
| Recipient                                                             | Sprint3 Recipient | `recipient_sprint3_test@example.com` |
| Initially unrelated account; later recipient of a separate invitation | Sprint3 Outsider  | `outsider_sprint3_test@example.com`  |

The existing password minimum remained 15 characters. A request to consider eight
characters was discussed but no policy change was approved or implemented.

Recorded test invitation IDs (identifiers, not credentials):

- Sender → recipient: `6ae3bd9842dafb09108310f8`, ultimately accepted.
- Sender → outsider: `6ae4ac00edcb522d1d5f1971`, ultimately declined.

The outsider's rejection was checked on the first invitation. Becoming a recipient
of the second invitation correctly gives that account response rights only there.

## Steps, meaning, and reported results

| Step                      | Action and purpose                                                                                                                                | Reported evidence / result                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First startup             | Run `npm --prefix backend start` against the fresh test database; prepare storage before serving requests                                         | Terminal showed MongoDB connected/ping verified and listening on port 3001                                                                                                                        |
| Second startup            | Stop with Ctrl+C and run the same command with the same restricted user; check the stored validation is accepted without an administrative update | Same success messages on restart; supports compatibility of this stored validator and reported read/write-only configuration                                                                      |
| Collections               | Inspect test database in Atlas                                                                                                                    | Shorena confirmed `users`, `sessions`, and `invitations`                                                                                                                                          |
| Indexes                   | Inspect invitation indexes, including pair uniqueness                                                                                             | Confirmed `_id_`, unique `invitation_pair_unique`, `invitation_incoming`, and `invitation_outgoing`                                                                                               |
| Validation settings       | Inspect the collection's rules, level, and action                                                                                                 | Shorena pasted the expected required fields, types, statuses, message bound, and rejection of extra fields; subsequently confirmed settings were all correct after being asked about Strict/Error |
| Accounts                  | Register and sign in through existing UI                                                                                                          | Sender, recipient, and outsider registration/sign-in reported successful                                                                                                                          |
| Lookup                    | As sender, find recipient by exact email; like finding a contact before writing                                                                   | Recipient ID/display name returned; a later pasted lookup showed Sprint3 Recipient and its account ID                                                                                             |
| Create                    | Send the first test invitation                                                                                                                    | User reported completion and supplied invitation ID; expected initial response was 201/pending, but the complete response was not pasted                                                          |
| Sender list               | Request outgoing list                                                                                                                             | Invitation ID supplied during this step; no separate full outgoing-list response retained, so do not overstate independent list verification                                                      |
| Outsider restriction      | Unrelated account attempts acceptance of first invitation; like keeping someone else's letter private                                             | Explicitly reported HTTP 404                                                                                                                                                                      |
| Recipient list            | Recipient loads incoming list                                                                                                                     | User confirmed first invitation appeared after expected 200/pending instructions                                                                                                                  |
| Maybe Later               | Recipient responds `deferred`; keep the invitation available                                                                                      | User confirmed expected successful result                                                                                                                                                         |
| Accept later              | Recipient changes deferred invitation to accepted                                                                                                 | User confirmed expected successful result                                                                                                                                                         |
| Final-decision protection | Try changing acceptance to decline                                                                                                                | Explicitly reported HTTP 409                                                                                                                                                                      |
| Persistence               | Restart backend and fetch recipient's incoming list again                                                                                         | User confirmed expected 200 with same accepted invitation; supports data persistence across application restart                                                                                   |
| Duplicate prevention      | Sender attempts another invitation to same recipient                                                                                              | Expected duplicate message pasted; user later confirmed HTTP 409 on October 30                                                                                                                    |
| Decline                   | Create sender → outsider invitation, then sign in as that invitation's recipient and choose “I need some space”                                   | New invitation ID supplied; decline explicitly reported HTTP 200 after instructions expecting declined status                                                                                     |
| Safe retry                | Repeat decline and compare returned `updatedAt` and `respondedAt` against previous response                                                       | User confirmed expected 200/declined and both equality checks true; like pressing the same button twice without resetting its recorded time                                                       |
| Database rejection        | In Atlas Insert Document, attempt an incomplete invitation without bypassing validation                                                           | Pasted “Document failed validation,” `$jsonSchema`/required-field failure; malformed document was rejected                                                                                        |

### Correction during duplicate testing

An earlier attempt returned 400 for invalid recipient/message input. The likely
cause was a placeholder recipient ID; the exact submitted body was not retained.
We did not count it as a duplicate-prevention pass. A fresh exact-email lookup
returned the real recipient account ID; retrying then produced the duplicate-pair
error, and Shorena later confirmed 409. Account IDs and invitation IDs are different.

### Limits of the rejected-document check

The intended incomplete document contained only a message. The Atlas error listed
`message` among missing fields too, so the exact submitted document cannot be
certified from the instructions alone. What the pasted output establishes is that
MongoDB rejected a document missing required fields. It does not individually
verify every type, status, length, whitespace, or extra-field rule. The displayed
failing-document ID is not proof that a document was inserted.

## What these results establish, and what they do not

The reported checks support successful startup/restart, visible expected storage
configuration, account flows, invitation ownership restrictions, response choices,
final-state protection, retry stability, persistence, sequential duplicate rejection,
and actual MongoDB required-field rejection in this test environment.

Still unverified live:

- Simultaneous duplicate creation and conflicting final responses against MongoDB.
  Sequential duplicates and simulated race tests do not establish this live.
- Pagination query plans/index usage and realistic performance or load.
- Full live pagination and every individual validator constraint.
- Independent inspection of database roles, active connection settings, or hosted CI.
- Frontend invitation controls, browser accessibility, and production deployment.

No live seed script, automated real-database suite, password-policy change, or
permission expansion was implemented. Test records remain for now; cleanup or
further live writes require their own authorized scope. No fresh automated suite
was run merely to write this report. The latest measured automated baseline is
158 passing tests from the earlier approved fixes and Claude's follow-up review.

## Next work

1. Add the two explicit validator regression cases from Claude: no validator and
   a slightly weaker validator (for example, message maxLength 5000), after approval.
2. Write administrator instructions for deliberate validator updates, after approval.
3. Restore original development connection settings privately after testing; do not
   copy credentials into documentation or commit `.env`.
4. Hand frontend design/implementation to Claude with design approval first; Codex
   independently reviews. Only one agent edits the task at a time.
5. Finish frontend/manual accessibility checks, sprint documentation, and final
   review. Sprint 3 is not complete or merged; merge needs explicit user approval.

Shorena requested short, plain explanations before every test: what it does, why,
what action to take, and what result to expect, with everyday analogies where useful.
