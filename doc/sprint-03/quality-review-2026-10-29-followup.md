# Follow-up quality review: Sprint 3 backend fixes, 2026-10-29

**Reviewer:** Claude (independent re-review, read-only)

**Scope:** `0725c55..20ad1ba`, covering `c8c3d32` (verify invitation validation
without startup `collMod`) and `911443d` (retry timestamps, pagination across dates,
Unicode tests). The checkout was clean at `20ad1ba` before and after the review.

**Original review:** [quality-review-2026-10-29.md](quality-review-2026-10-29.md),
left unchanged.

**Result:** The startup fix does what was asked, and the new tests address findings
3–5 of the original review. All local checks pass and no regressions were found.
The main open question is whether a real Atlas database returns the validator in
exactly the form the code compares against; only the live check can show that.
Sprint 3 is not complete: live Atlas verification and the frontend workflow remain.

## Startup fix

File: [invitation-storage.js](../../backend/src/invitation-storage.js)

| Case                                                    | Behaviour                                                                                  | Safe?                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------ |
| Matching validator, settings stored explicitly          | Passes; no create, no `collMod` (L53-56)                                                   | Yes                      |
| Matching validator, settings left at defaults           | Missing settings are treated as the defaults `strict`/`error` (L42-43)                     | Yes                      |
| Collection missing                                      | Created with the full validator (L59)                                                      | Yes                      |
| No validator, different validator, `moderate` or `warn` | Startup stops before indexes, asking for an administrator update (L39-47)                  | Yes, nothing is weakened |
| Another process creates the collection first (code 48)  | The winner's settings are checked again; weak or missing validation stops startup (L63-69) | Yes                      |
| The inspection itself fails                             | The error is passed up before any index work                                               | Yes                      |
| `collMod`                                               | No longer called anywhere                                                                  | Yes                      |

## Remaining findings

**1. Medium: the exact comparison has not been tested against a real server.**

- [invitation-storage.js:41](../../backend/src/invitation-storage.js#L41) compares
  the server's stored validator with the code's validator using `isDeepStrictEqual`.
- In the tests, the "existing" options are a copy of what the code itself passed to
  `createCollection` (`expectedValidation` in
  [invitation-storage.test.js](../../backend/test/invitation-storage.test.js)). The
  matching test is therefore guaranteed to pass and cannot show how a real server
  returns the stored validator.
- The reviewer does not know of MongoDB rewriting validators, but that is
  unconfirmed.
- **Failure scenario:** if Atlas returns the validator in a slightly different form
  (for example an extra key or a different number type), every startup after the
  first fails. That fails safely, but it blocks the app.
- **Fix:** add one step to the planned live Atlas check. Start the backend twice
  against a fresh test database, using a user with only read/write access, and
  confirm the second startup passes.

**2. Low (test gap): no test shows a weaker validator is rejected.**

- The mismatch tests use an empty validator `{}` and the two weak settings.
- No test has an existing collection created with no validator at all (stored
  options `{}`), which is the realistic case for an old local database.
- No test has a validator that is only slightly weaker, such as `maxLength: 5000`.
- The code already rejects both through the same branch, so this is about stating
  the guarantee in a test, not about a bug.

**3. Low (docs): there are no written steps for the administrator update.** The
progress doc and the startup error say an administrator must update the validator,
but no steps exist anywhere. Any local database created at `b31ff27`, before
validation was added, will now fail startup. That is correct, but someone will need
those steps.

**4. Optional:**

- The existing-collection path queries `listCollections` twice
  ([invitation-storage.js:36](../../backend/src/invitation-storage.js#L36) and
  [L53](../../backend/src/invitation-storage.js#L53)). The first result could be
  passed into the check.
- In the race case where the collection then disappears, the message says
  "validation differs", which is a bit misleading. Users never see it, because
  [lifecycle.js](../../backend/src/lifecycle.js) replaces it with its own stage
  message.

## Findings 3–5 from the original review

- **3 (retry timestamps): addressed.**
  - When the requested status matches the current one, the test now checks the
    returned status, `createdAt`, `updatedAt` and `respondedAt` against `before`
    ([invitation-response.test.js:110-118](../../backend/test/invitation-response.test.js#L110-L118)).
  - A handler that returned a fresh `now` would now fail.
- **4 (pagination across dates): addressed.**
  - The new test's second page needs record 9, which is older but has a higher ID
    than the cursor
    ([invitation-listing.test.js:199-225](../../backend/test/invitation-listing.test.js#L199-L225)).
  - A filter on `_id` alone would miss it, so the test would fail.
  - The limitation is unchanged: the fake reads the code's own `$or` shape.
- **5 (Unicode): addressed.**
  - 1,500 emoji (3,000 code units) are accepted and 1,501 rejected.
  - A message of only U+3000 is rejected.
  - Unicode trimming is checked in both the response and the stored record
    ([invitation-creation.test.js:206-222](../../backend/test/invitation-creation.test.js#L206-L222)).

## Measured (checks run during this re-review)

| Check                                | Result  | Detail                                                                                |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------- |
| `npm run lint`                       | PASS    |                                                                                       |
| `npm run format:check`               | PASS    |                                                                                       |
| `npm run typecheck`                  | PASS    |                                                                                       |
| `npm run test:coverage`              | PASS    | 158 tests, 158 pass, 0 fail/skip/cancelled; 100% lines and functions, 98.27% branches |
| Frontend build to scratch `--outDir` | PASS    | tracked `frontend/dist` untouched                                                     |
| Audits                               | NOT RUN | excluded by the review instructions                                                   |

- **Coverage:** matches the reported numbers. `invitation-storage.js` is at 100%
  branch coverage. Coverage shows which code ran, not that it is correct.
- **Docs:** the changes in `20ad1ba` match the code and the results above.
- **Git:** `git status --short` was empty before and after the checks.

## Not verified

- Real MongoDB/Atlas behaviour:
  - how the stored validator comes back from the server
  - read/write-only permissions
  - unique-index races
  - query plans
- Hosted GitHub checks, the frontend, and accessibility.
