# Quality review: sprint-04-conversations, 2026-11-03, scope: changed

Claude `/quality-review`, read-only, before live/manual testing. Sprint 4 is not
complete or approved for merging.

## Checkout

| Item        | Value                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| Branch      | `sprint-04-conversations` at `fd0b855`, Desktop checkout                       |
| Main        | `1db8bd9` at `/private/tmp/CallingIn-main-design-20261103`                     |
| Merge base  | `0921e62`; main has 3 docs-only commits not on the branch                      |
| Branch work | 8 Sprint 4 commits, 50 files changed against main                              |
| Git status  | Only 3 untracked design PNGs under `public/images/`, present before the review |
| Node        | v26.0.0                                                                        |

Scope: files changed in `git diff main...HEAD`. Shared config (ESLint,
tsconfig, package manifests, Playwright config) was not changed by Sprint 4.

## Summary

No blockers found. All local checks run in this review passed. Five low-to-medium
findings; the main remaining limits are live Atlas, real-browser, and human checks.

| Check               | Result        | Key detail                                                     |
| ------------------- | ------------- | -------------------------------------------------------------- |
| `npm run lint`      | PASS          |                                                                |
| `npm run format`    | PASS          | `npm run format:check`                                         |
| `npm run typecheck` | PASS          | Frontend and backend                                           |
| Tests + coverage    | PASS          | 241 passed, 0 failed/skipped; 100% lines/functions, 98.34% br. |
| Scratch build       | PASS          | `--outDir` in the session scratchpad; tracked dist unchanged   |
| Playwright          | PASS          | 64 Chromium tests, mocked APIs; 7 new tests include axe scans  |
| Root audit          | NOT COMPLETED | Needs network; not run without approval                        |
| Frontend audit      | NOT COMPLETED | Needs network; not run without approval                        |
| Backend audit       | NOT COMPLETED | Needs network; not run without approval                        |

Files created or changed by checks: none tracked. Playwright rewrote the ignored
`playwright-report/` and `test-results/` folders.

## Measured

Commands: `npm run lint`, `npm run format:check`, `npm run typecheck`,
`npm run test:coverage`,
`npm --prefix frontend run build -- --outDir <scratchpad>/build --emptyOutDir`,
and `npx playwright test --reporter=list`.

Files below 100% branch coverage (all at 100% lines and functions):

| File                       | Branch % | Changed in Sprint 4 |
| -------------------------- | -------- | ------------------- |
| `conversation-access.js`   | 90.00    | Yes                 |
| `conversation-opening.js`  | 96.43    | Yes                 |
| `message-pagination.js`    | 96.55    | Yes                 |
| `authentication.js`        | 98.70    | No                  |
| `invitation-creation.js`   | 96.15    | No                  |
| `invitation-listing.js`    | 93.33    | No                  |
| `invitation-pagination.js` | 93.55    | No                  |
| `invitation-response.js`   | 95.83    | No                  |
| `recipient-lookup.js`      | 93.33    | No                  |

The Node coverage report does not name the missed branch locations because line
coverage is 100%. These results match the numbers Codex reported earlier.
Coverage shows which code ran, not that it is correct.

## Judged (reviewer reading, not tool output)

| #   | Severity                   | file:line                                                                      | Finding                                                                                                                                                                                                                    | Why it matters                                                                                                                  | Proposed fix                                                                                                    |
| --- | -------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Medium (design, confirmed) | `frontend/src/social-battery/social-battery.css:58-60`                         | Busy uses pale cream `#ffe8b8`, not the golden yellow in the spec and design reference. Empty segments are `#edf1ef`, so filled Busy segments are separated mainly by a thin outline. Axe does not check SVG fill colours. | Busy can look almost empty or Not set at a glance, especially on a dim phone screen.                                            | Use a saturated gold such as `#e8a317` with the existing dark outline. Exact colour is Shorena's design choice. |
| 2   | Low (confirmed)            | `frontend/src/conversations/useConversation.js:131-134`, `Conversation.jsx:84` | A 401 on the first history load calls the expiry handler but leaves history in the loading state.                                                                                                                          | "Loading messages…" stays visible and in the screen-reader status beside "Your session has ended". The draft is still retained. | Leave the loading state on expiry and add a browser test for this case.                                         |
| 3   | Low (confirmed)            | `README.md:105`, README sections 4–5                                           | README still says "private conversations come later" and describes messaging and Social Battery in the future tense.                                                                                                       | Readers get the wrong current behaviour.                                                                                        | Update for Sprint 4 once merging is approved.                                                                   |
| 4   | Low (suggestion)           | `backend/src/social-battery.js:59-67`                                          | The partner status read repeats the membership query already done by `requireConversation`.                                                                                                                                | Two database reads per request. The room-removed 404 is tested, so this is not a bug.                                           | Have `requireConversation` keep the participant list for the handler, or leave as is.                           |
| 5   | Low (suggestion)           | `backend/src/conversation-storage.js:33-70`, `message-storage.js:26-63`        | Validator check, collection creation, and race handling are nearly identical in three storage files, including `invitation-storage.js`.                                                                                    | A future fix would need to be made three times.                                                                                 | Optionally extract one shared helper (meets the 3-use bar). Trade-off: storage tests need restructuring.        |

### Uncertainties and minor notes

- Text made only of zero-width characters (for example U+200B) passes the client
  trim, the server trim, and the database `\S` pattern, so an invisible message
  could be stored. Low risk.
- "Keep writing" returns focus to Back to invitations rather than the reply box.
  The tests expect this, so it appears intentional.
- On expiry, `PartnerBattery.jsx:27` shows its own alert in addition to the main
  expiry notice, so a screen reader announces it twice.

### Looked correct

- Only participants can open conversations, read history, or send messages;
  outsiders and missing rooms share a 404.
- Rooms open only from accepted invitations; a unique index guarantees one room
  per invitation, and the duplicate-key race returns the saved room.
- History pagination stays scoped to the authorized room, rejects unknown or
  repeated parameters, and orders by time then ID.
- The 60-per-minute sending limit is per account and shared across rooms.
- Social Battery saves only for the signed-in account, accepts three values,
  shows Not set for absent values, and is not consulted by invitations or
  messages.
- Late responses are ignored after navigation or refresh; drafts are retained on
  session expiry.

## Tests (success/failure gaps)

- Backend HTTP tests use real Express guards with simulated database methods.
  The message fake in `backend/test-support/messages.js` reproduces only the
  query shape the code uses. They do not prove MongoDB behaviour for the cursor
  query, indexes, validators, or the `$setOnInsert` race.
- All browser tests mock the API. No test runs the real frontend against the
  real backend.
- Missing cases: expiry during the first history load (finding 2) and
  zero-width-only text.

## Guardrail gaps (known list)

No item judged NEW or WORSENED. Partially improved since the original list:
frontend browser tests and axe scans now exist. Still unchanged as far as this
review checked: no frontend coverage measurement, no enforced coverage threshold,
tracked `frontend/dist`, type checks excluding tests and config, no duplication
detector. The remaining items were not re-verified in this review.

## Manual checklist (NOT CHECKED)

- [ ] Keyboard-only navigation and visible focus — NOT CHECKED
- [ ] Screen reader pass; color contrast (including Busy battery) — NOT CHECKED
- [ ] Real browser at mobile and desktop widths; Safari; 200% zoom — NOT CHECKED
- [ ] Live MongoDB/Atlas behavior — NOT CHECKED
- [ ] Security judgment (rate limiting, enumeration, secrets) — NOT CHECKED
- [ ] UX copy and tone — NOT CHECKED

Live checks still needed:

- Atlas startup creating `conversations` and `messages` with their validators
  and indexes; the open-twice race against the real unique index; real message
  pagination; saving `socialBattery` under any configured user validator;
  backup evidence.
- Two real accounts in two browsers: accept, open, exchange messages, and
  refresh to see the other person's replies.
- The sending limit across a backend restart (in-memory counters reset and are
  not shared between processes).
- Checks carried over from Sprint 3 remain open.

## Not checked

- The three `npm audit` commands (need network; approval not yet given).
- Live Atlas or any other external service.
- Human keyboard, VoiceOver, Safari, zoom, and phone checks.

## Proposed fixes (none applied)

1. Busy battery: switch to a saturated gold chosen by Shorena (finding 1).
2. First-history expiry: clear the loading state and add a browser test
   (finding 2).
3. Update the README for Sprint 4 (finding 3).
4. Optional: reuse the participant list from the access check (finding 4).
5. Optional: one shared collection-preparation helper (finding 5).
6. Optional: reject zero-width-only messages on client and server.

Awaiting Shorena's choice; Codex implements approved fixes.
