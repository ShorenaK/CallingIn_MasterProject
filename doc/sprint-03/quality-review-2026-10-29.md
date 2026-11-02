# Quality review: sprint-03-invitations, 2026-10-29

**Reviewer:** Claude (independent review, read-only)

**Scope:** Sprint 3 backend changes, `38a9a3c..7afcb1e`. The checkout was clean at
`0725c55` before and after the review.

**Result:** No confirmed code defect. One likely startup problem needs a live Atlas
check. Sprint 3 is not complete: the frontend invitation workflow and live Atlas
verification are pending. No merge is recommended yet.

## Findings

### Likely defect (needs a live Atlas check)

**1. High: restarts may fail if the Atlas user only has read/write access.** In
[invitation-storage.js:35-45](../../backend/src/invitation-storage.js#L35-L45), the
first startup creates the collection with its validator. Every later startup gets
NamespaceExists and then runs `collMod`.

- MongoDB's built-in `readWrite` and `readWriteAnyDatabase` roles allow
  `createCollection` and `createIndex`. As far as the reviewer knows, `collMod`
  belongs to `dbAdmin`. This has not been verified against Atlas.
- **Failure scenario:** an app user with only "read and write" access starts cleanly
  once. The next restart fails with "Invitation storage setup failed". The database
  fakes cannot show this.
- **Fix options:**
  - (a) Read the current validator with `listCollections` and run `collMod` only
    when it differs.
  - (b) Move validator setup into a one-time admin step.
  - (c) Document that `dbAdmin` is required.

  Include this in the planned live Atlas test, using a test user with only
  read/write access.

### Test gaps

**2. Medium: the fakes copy the code's own logic, so they cannot catch real MongoDB
differences.**

- In the response tests
  ([invitation-response.test.js:27-40](../../backend/test/invitation-response.test.js#L27-L40)),
  the fake is atomic only because JavaScript is single-threaded.
- The cookie integration fake
  ([invitation-cookie-integration.test.js:72-86](../../backend/test/invitation-cookie-integration.test.js#L72-L86))
  ignores sort, the cursor `$or` and projection. Its `createCollection` is a no-op
  (line 105).
- Nothing tests validator rejection, the real unique index, `findOneAndUpdate`
  return behaviour in the v7 driver, or whether the `$or` cursor query uses the
  pagination indexes.
- **Fix:** add a small opt-in test suite against a local or disposable test
  database. That is a separate decision.

**3. Low: retry tests do not check the response body.** At
[invitation-response.test.js:110-112](../../backend/test/invitation-response.test.js#L110-L112),
when the requested status equals the current one, the test checks that nothing was
written but not the returned timestamps. If the handler returned a fresh `now` in
the body without saving it, the test would still pass. **Fix:** assert that the
body's `updatedAt` and `respondedAt` equal `before`.

**4. Low: page boundaries across different timestamps are not tested.** At
[invitation-listing.test.js:144-167](../../backend/test/invitation-listing.test.js#L144-L167),
all paged records share one `createdAt`. No test has an older `createdAt` with a
higher `_id`, which is the case that needs the `createdAt: { $lt }` branch. The code
looks correct; this is about regression protection.

**5. Low: message length is not tested with emoji or Unicode whitespace.** One emoji
counts as two JavaScript code units. Nothing tests that 1,500 emoji (3,000 code
units) are accepted and 1,501 are rejected. Nothing tests that a message of only
U+3000 (ideographic space) is rejected. The MongoDB validator counts characters, so
it is looser than the API check and will not reject anything the API accepts.

### Optional improvements

**6. Startup failures hide the reason.** At
[lifecycle.js:135-140](../../backend/src/lifecycle.js#L135-L140), the startup catch
discards the error entirely, so a permission failure looks the same as a network
failure. Logging the allowlisted name and code from `safe-logging` would help.
Adding `13` (Unauthorized) and `121` (DocumentValidationFailure) to the code
allowlist would help with finding 1.

**7. `respondedAt` is overwritten.** Going from Maybe Later to Accept overwrites
`respondedAt` at
[invitation-response.js:54](../../backend/src/invitation-response.js#L54), so the
deferral time is lost. This matches the approved rules; whether to keep the deferral
time is a product decision.

**8. Error text says "characters".**
[invitation-creation.js:48](../../backend/src/invitation-creation.js#L48) says
"1–3000 characters" but the check counts code units. Emoji users will hit the limit
sooner than the message suggests.

### Checked and found sound

- **Origin and JSON protection:** runs before body parsing on all account routes
  ([app.js:42-44](../../backend/src/app.js#L42-L44)).
- **Deleted accounts:** `requireAccount` checks the account exists on every request.
  A deleted account gets 401, and its session is removed and the cookie cleared. If
  the session cannot be destroyed, the request still fails safely with 503.
- **Lookup and rate limits:**
  - Lookup normalizes the email the same way registration does.
  - A missing recipient and a self-lookup return the same 404.
  - Both limiters run after `requireAccount` and are keyed by account ID.
  - Lookup and creation have separate counters, and the tests prove it.
- **Sender identity:** always comes from the session. Extra fields are rejected.
- **Duplicates:** the sorted pair key covers both directions. A duplicate-key error
  (code 11000) maps to 409.
- **Responses:**
  - The `$in` filter enforces the legal transitions.
  - Repeating the current response makes no write.
  - Changing a final response returns 409.
  - Accept and decline arriving together have exactly one winner.
- **Lists:** Express 5's default query parser turns repeated parameters into arrays,
  and the parser rejects them. The projection excludes `pairKey`.
- **Logs:** contain only the operation, an allowlisted error name and an allowlisted
  code.

## Measured (checks run during this review)

| Check                                 | Result        | Detail                                  |
| ------------------------------------- | ------------- | --------------------------------------- |
| `npm run lint`                        | PASS          | 0 warnings                              |
| `npm run format:check`                | PASS          |                                         |
| `npm run typecheck`                   | PASS          | frontend and backend                    |
| `npm run test:coverage`               | PASS          | 151 tests, 151 pass, 0 fail or skipped  |
| Frontend build to scratch `--outDir`  | PASS          | tracked `frontend/dist` untouched       |
| `npm audit` (root, frontend, backend) | NOT COMPLETED | needs network; not run without approval |

- **Coverage:** 100% lines and functions, 98.19% branches, matching the reported
  numbers.
  - Files below 100% branch coverage: `invitation-listing` (92.86%),
    `invitation-pagination` (93.33%), `recipient-lookup` (93.33%),
    `invitation-response` (95.83%), `invitation-creation` (96.00%) and
    `authentication` (98.72%).
  - Node's report does not list which branches were missed.
  - Coverage shows which code ran, not that it is correct.
- **Shared config:** none changed in this range.
- **Files created or changed by the checks:** none (`git status --short` was empty).
- **Guardrail gaps:** the rate-limit gap on `/api/auth/register` is resolved
  ([app.js:49](../../backend/src/app.js#L49)). The others are unchanged, and none are
  new.

## Not checked

- Live MongoDB or Atlas behaviour: validator, indexes, permissions, query plans.
- Network audits.
- Hosted GitHub checks.
- The frontend workflow and browser accessibility.
- The `.codex-memory/` records listed in AGENTS.md. The review relied on the Sprint 3
  docs and the current source instead.

## Proposed fixes (none approved yet)

1. **Validator permissions (finding 1):** add the read/write-only test user to the
   live Atlas plan. If restarts fail, choose fix (a), (b) or (c). Files:
   `backend/src/invitation-storage.js` and its tests.
2. **Retry timestamps (finding 3):** add the body assertions. One test file.
3. **Cursor and message-length tests (findings 4 and 5).** Test files only.
4. **Startup diagnostics (finding 6):** log the allowlisted name and code on startup
   failure. Files: `backend/src/lifecycle.js` and `backend/src/safe-logging.js`.
5. **Real-database tests (finding 2):** decide whether to add opt-in tests against a
   real database.
