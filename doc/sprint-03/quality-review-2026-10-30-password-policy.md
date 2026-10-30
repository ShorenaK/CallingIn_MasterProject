# Quality review: password policy and validator follow-ups, 2026-10-30

**Reviewer:** Claude (independent review, read-only except for this report)

**Branch / HEAD:** `sprint-03-invitations` at `bbdb4d0`. The working tree was
clean before and after the checks.

**Scope:** `68583df..bbdb4d0`: `cc82acc`, `abdb7dd`, `0989250`, `f90da8d`,
`bbdb4d0` (12 files). Reviewed with the manual `quality-review` skill, as you asked.

**Earlier reviews:** [quality-review-2026-10-29.md](quality-review-2026-10-29.md)
and [quality-review-2026-10-29-followup.md](quality-review-2026-10-29-followup.md)
are unchanged.

**Result:** The server applies the approved rules correctly. Password hashing and
sign-in for existing accounts are unchanged, and tests show it. The two new
validator tests do what the follow-up review asked for. One medium defect: the
registration field's `maxLength={18}` silently cuts off a longer pasted password.
That breaks the "never silently altered" rule. The other findings are low-severity
wording, test-strength, and documentation issues. **Sprint 3 is not complete:**
the frontend invitation workflow is still pending.

## Summary of measured checks

| Check                                 | Result  | Key detail                                                                                         |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `npm run lint`                        | PASS    | `--max-warnings 0`                                                                                 |
| `npm run format:check`                | PASS    | All matched files use Prettier style                                                               |
| `npm run typecheck`                   | PASS    | Frontend and backend `tsc`                                                                         |
| `npm run test:coverage`               | PASS    | **164 tests, 164 pass**, 0 fail/skip/cancelled/todo; 100% lines and functions, **98.30% branches** |
| Frontend build to scratch `--outDir`  | PASS    | Session scratchpad; tracked `frontend/dist` untouched                                              |
| `npm audit` (root, frontend, backend) | NOT RUN | Network audits excluded by the review instructions                                                 |

- **Test count:** 164 = the previous full baseline of 162 plus the two validator
  tests. This is the first full-suite run that includes them.
- **Shared config:** no changes to shared config (eslint, tsconfig, package
  manifests, workflows, hooks) in the range.
- **Files changed by the checks:** none. `git status --short` was empty afterwards.
  This report is the only file written.

## Measured coverage

Line coverage is 100% and function coverage is 100% in every backend file. The
reporter lists no uncovered lines. Files under 100% branch coverage are below.
None was changed in this range, and all match the earlier reviews.

| File                       | Branch % |
| -------------------------- | -------- |
| `authentication.js`        | 98.72    |
| `invitation-creation.js`   | 96.15    |
| `invitation-listing.js`    | 92.86    |
| `invitation-pagination.js` | 93.55    |
| `invitation-response.js`   | 95.83    |
| `recipient-lookup.js`      | 93.33    |

The files changed in this range (`account-policy.js`, `registration.js`,
`invitation-storage.js`) are at 100/100/100. Coverage measures executed code, not
correctness. The frontend has no automated tests, so none of the frontend
password changes are covered by any measurement.

## Policy compliance (approved behaviour against current source)

| Approved rule                                          | Server                                                                                                                              | Frontend                                                                                                            | Verdict                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| New accounts 8–18 characters                           | [registration.js:21-25](../../backend/src/registration.js#L21-L25)                                                                  | `minLength={8}`, `maxLength={18}`, JS check ([useSignIn.js:51-52](../../frontend/src/account/useSignIn.js#L51-L52)) | Met; see finding 1 about `maxLength`        |
| Reject all whitespace                                  | `/\s/u` ([registration.js:26](../../backend/src/registration.js#L26))                                                               | Same regex ([useSignIn.js:53-54](../../frontend/src/account/useSignIn.js#L53-L54))                                  | Met; message says only "spaces" (finding 2) |
| Reject full email, ignoring case                       | [account-policy.js:48-50](../../backend/src/account-policy.js#L48-L50), registration only                                           | [useSignIn.js:55-56](../../frontend/src/account/useSignIn.js#L55-L56), email already trimmed at L19                 | Met; both sides agree                       |
| No letter/number requirement                           | None present                                                                                                                        | None present                                                                                                        | Met                                         |
| Four rules shown below the registration field          | n/a                                                                                                                                 | [SignIn.jsx:89-107](../../frontend/src/account/SignIn.jsx#L89-L107), linked by `aria-describedby`                   | Met; wording issue (finding 3)              |
| Existing accounts sign in up to 128 characters, spaces | Login uses `validPassword` 8–128 with no whitespace or email rule ([authentication.js:28](../../backend/src/authentication.js#L28)) | `maxLength={128}` in sign-in mode                                                                                   | Met                                         |
| Never silently trimmed or altered                      | Not trimmed ([password.js:29](../../backend/src/password.js#L29); `useSignIn.js:20`)                                                | **`maxLength={18}` truncates pasted input**                                                                         | **Not met in the browser (finding 1)**      |
| Sign-in guidance text                                  | n/a                                                                                                                                 | Exact text at [SignIn.jsx:103](../../frontend/src/account/SignIn.jsx#L103)                                          | Met                                         |
| Google sign-in is future work only                     | No code                                                                                                                             | No code                                                                                                             | Met (README "future" section)               |
| Hashing unchanged                                      | `password.js` and the scrypt constants are unchanged in the range (`git diff`)                                                      | n/a                                                                                                                 | Met; the test anchor is weaker (finding 4)  |

**Existing accounts:** the minimum was 15 before this change, so every existing
password is ≥ 15 characters. Sign-in's `minLength={8}` therefore cannot block an
existing user. Two existing tests still sign in through the login handler with
long, space-containing passwords: `'Public test password for authentication'`
(40 characters, [authentication.test.js:12](../../backend/test/authentication.test.js#L12))
and `'Public integration test password'` over real HTTP
([authentication-integration.test.js:13](../../backend/test/authentication-integration.test.js#L13)).
Both pass, which is the strongest evidence that existing accounts still work.

**Policy tradeoff (approved, not a defect):** an 8-character minimum is below
current NIST SP 800-63B guidance for single-factor passwords (15 characters).
An 18-character maximum is below NIST's recommendation to allow at least 64.
Together they shrink the space of possible passwords and stop users from choosing
longer passphrases. The README and the progress record state this openly. The
server's per-IP login limit (10 per 15 minutes) reduces online guessing. It does
not protect against offline cracking if password hashes leak; scrypt at N=2^17
slows that down.

## Defects

| #   | Severity   | file:line                                                                                                                                                                               | Finding                                                                                                                                  |
| --- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Medium** | [SignIn.jsx:70](../../frontend/src/account/SignIn.jsx#L70)                                                                                                                              | `maxLength={register ? 18 : 128}` makes the browser silently truncate typed or pasted input at 18 characters during registration.        |
| 2   | Low        | [registration.js:26](../../backend/src/registration.js#L26), [useSignIn.js:54](../../frontend/src/account/useSignIn.js#L54), [SignIn.jsx:99](../../frontend/src/account/SignIn.jsx#L99) | The rule rejects all whitespace, but the guidance and error message mention only "spaces".                                               |
| 3   | Low        | [SignIn.jsx:94-99](../../frontend/src/account/SignIn.jsx#L94-L99)                                                                                                                       | The guidance list is ungrammatical: "Your password must: … Don’t use your email address."                                                |
| 4   | Low (test) | [password.test.js:79-96](../../backend/test/password.test.js#L79-L96)                                                                                                                   | The explicit hash-format assertion `^scrypt\$131072\$8\$1\$…` was removed. "Hashing is unchanged" is now shown only indirectly.          |
| 5   | Low (test) | [registration.test.js:179-191](../../backend/test/registration.test.js#L179-L191)                                                                                                       | The test name says existing-password verification is unchanged, but nothing in it could fail if sign-in started applying the email rule. |
| 6   | Low (docs) | [sprint-03-progress.md:11](sprint-03-progress.md), [:135](sprint-03-progress.md), [:207-208](sprint-03-progress.md), [:246](sprint-03-progress.md), [:265-266](sprint-03-progress.md)   | The progress record has stale or contradictory statements.                                                                               |
| 7   | Low (docs) | [invitation-validator-admin-guide.md:20](invitation-validator-admin-guide.md)                                                                                                           | The link text "account-policy helpers" points to `invitation-policy.js`.                                                                 |

### 1. Medium: registration silently truncates longer passwords

- **Failure example:** a user pastes the 22-character password
  `CorrectHorseBattery!42` from a password manager or note. The browser keeps the
  first 18 characters, `CorrectHorseBatter`, with no message. That passes every
  client and server rule, and the account is created with the shortened password.
  The user's saved copy, and their memory, still hold the 22-character version.
  Signing in with it fails ("Email or password is incorrect."). The password was
  silently altered, which the approved behaviour forbids.
- **Why the safeguards don't help:** the JS check `length > 18`
  ([useSignIn.js:51](../../frontend/src/account/useSignIn.js#L51)) and the server's
  18-character error can never run for typed or pasted input, because the browser
  truncates first. The progress note ("passwords are never silently stripped of
  spaces", line 246) is true only for whitespace.
- **Fix:** in registration mode, remove the 18 from `maxLength`. Either omit it, or
  keep `128` as an input-size bound only. The existing JS and server checks then
  show "Password must be 8–18 characters." Leave sign-in at `128`; that matches
  the server bound and no existing password is longer.
- **Tradeoff:** users can type past 18 and only find out when they submit. The
  visible rule list makes that clear. A live character counter is an optional
  later improvement.

### 2. Low: "spaces" undersells the whitespace rule

- **Failure example:** the password `abcd 1234` contains a non-breaking
  space, which some sources produce when copied. It is rejected with "must not
  contain spaces", although the user may not see a space at all.
- Tabs can be pasted. Line breaks are removed by the browser from
  `type="password"` inputs before any check runs. That is a standard browser
  behaviour, not this app, so a pasted line break is dropped before validation.
- **Fix:** change the wording, for example "Contain no spaces or other blank
  characters", in the list item and in both error messages. The test at
  [registration.test.js:193-215](../../backend/test/registration.test.js#L193-L215)
  checks the exact message and would need the same update.

### 3. Low: guidance list wording

"Your password must:" followed by "Don’t use your email address." reads as "must
don't use". Suggest **"Not contain your email address."** so all four items
complete the sentence. Screen readers read the whole `div` through
`aria-describedby` as one passage, so consistent grammar also helps there.

### 4. Low: the hash-format assertion was removed

The earlier version asserted the exact stored format
`scrypt$131072$8$1$<32 hex>$<128 hex>` for valid lengths. The rewritten loop no
longer does. "Hashing is unchanged" is now shown only indirectly, through
`rejects unsupported cost parameters`, which relies on `$131072$` being in the
hash. **Fix:** put the `assert.match` back inside the `length >= 8` branch, or
add a single format assertion. This was a review criterion, so it should be
tested directly.

### 5. Low: the existing-credential test cannot fail

`verifyPassword` takes no email argument, so "does not change existing password
verification" can never fail here. The test also hashes the password inside
itself, so it does not use an older stored credential. **Fix (optional
strength):** in `authentication.test.js`, sign in through the login handler with
an account whose password contains its own email and is longer than 18
characters. Example: password `'student@example.com is my old password'` for
`student@example.com`. Assert success. That test would fail if someone later
added the registration rules to sign-in.

### 6. Low: progress record accuracy

- Line 11 "Latest implementation/test tip: `911443d`" and lines 207-208 ("Latest
  pushed implementation tip is `911443d`") are out of date. Password and test
  commits now go up to `f90da8d`, with documentation at `bbdb4d0`.
- Line 135 "Live Atlas checks remain pending." contradicts lines 110-111 and
  174-192, which record the user-reported live checks.
- Line 246 "never silently stripped of spaces" holds only for whitespace (see
  finding 1).
- Lines 265-266 say the full suite was not rerun. This review measured
  **164 passing, 100% lines/functions, 98.30% branches**, which can replace that
  note.
- Lines 216-238 describe the 8–128 policy. That is labelled as superseded at
  line 247, which is acceptable as history.

The README section (lines 74-80) is accurate against the current source.

### 7. Low: administrator guide link label

At [invitation-validator-admin-guide.md:20](invitation-validator-admin-guide.md),
the text reads "the invitation message limit in [account-policy helpers]", but the
link target is `invitation-policy.js`. The target is correct
(`INVITATION_MESSAGE_MAX = 3000`). Change the label to "invitation policy".

## Validator tests (item 5 of the request)

[invitation-storage.test.js:255-285](../../backend/test/invitation-storage.test.js#L255-L285):

- **No validator (`options: {}`):** rejected with `/administrator must update/`.
  `createCollection`, `collection` and `command` all fail the test if they are
  called. So the test checks that the app neither recreates the collection, nor
  prepares indexes, nor attempts a `collMod`.
- **`maxLength: 5000`:** this test starts from the code's own validator
  (`expectedValidation`, a `structuredClone`) and weakens only that one field. It
  is a precise "slightly weaker" case and would fail if the comparison ignored
  numeric limits.
- Both tests would fail if the code accepted the weaker state. That resolves
  follow-up finding 2.

## Administrator guide accuracy (item 6)

Checked against [invitation-storage.js](../../backend/src/invitation-storage.js),
[lifecycle.js](../../backend/src/lifecycle.js), and `backend/package.json`.

| Topic                               | Guide                                                                                                          | Source / fact                                                                                                                                                                                                      | Verdict                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Validator body (L74-106)            | 9 required fields, patterns, `maxLength: 3000`, `pattern: '\\S'`, status enum, `respondedAt` `['date','null']` | Matches `properties`/`validationOptions` (L4-32) field for field, including array order                                                                                                                            | Accurate                                                                                               |
| Comparison semantics (L68-71)       | Key order irrelevant; array order/values must match                                                            | `isDeepStrictEqual` (L41) ignores key order, not array order                                                                                                                                                       | Accurate                                                                                               |
| Default level/action                | Sets `strict`/`error` explicitly                                                                               | Code treats missing as `strict`/`error` (L42-43)                                                                                                                                                                   | Accurate                                                                                               |
| Missing collection (L13-14, L44-45) | Created automatically at startup                                                                               | L53-59                                                                                                                                                                                                             | Accurate                                                                                               |
| Startup message (L16-17)            | May also mean connection/permission/index problems                                                             | `lifecycle.js:127-129` stage message is generic; raw error is not logged                                                                                                                                           | Accurate                                                                                               |
| Backup (L53-64)                     | Atlas snapshot or `mongodump` (data plus metadata); JSON export is not enough                                  | Correct for `mongodump`                                                                                                                                                                                            | Accurate; see limits                                                                                   |
| Data check (L107-115)               | `countDocuments({$nor: [expectedValidator]})`                                                                  | MongoDB documents `$nor` with `$jsonSchema` as the way to find non-conforming documents                                                                                                                            | Accurate; correctly says it checks shape, not business rules                                           |
| Permissions (L32-36)                | `collMod` via `dbAdmin`; reading needs read access; app keeps its limited role                                 | `dbAdmin` includes `collMod` and `listCollections` but not `find`                                                                                                                                                  | Accurate                                                                                               |
| Update (L128-140)                   | `collMod` with `strict`/`error`; never fall back to `warn`/`moderate`                                          | Matches what the code accepts                                                                                                                                                                                      | Accurate                                                                                               |
| Restart (L159-166)                  | `npm --prefix backend start`, confirm, restart, no `collMod`                                                   | Script exists (`node --env-file-if-exists=.env src/server.js`); success logs "MongoDB connected and ping verified." and "CallingIn backend listening at …" (`lifecycle.js:147-149`); the app never calls `collMod` | Accurate. Optional: quote the two success log lines so the operator knows what "successful" looks like |
| Link label (L20)                    | "account-policy helpers"                                                                                       | Target is `invitation-policy.js`                                                                                                                                                                                   | Finding 7                                                                                              |
| References (L185)                   | Live verification report                                                                                       | File exists                                                                                                                                                                                                        | Accurate                                                                                               |

The guide correctly says it has not been executed. It does not overclaim.

## Optional recommendations (not defects)

1. **Hard-coded limits in the frontend:** 8 and 18 each appear in several places
   (`minLength`, the `onInvalid` message, `maxLength`, `validateNewPassword`, the
   guidance text). This is acceptable for now. If the policy changes again, two
   named constants in `useSignIn.js` would stop the copies drifting apart. Shared
   frontend/backend constants would need a build-sharing decision; not needed now.
2. **Duplicated check logic:** the frontend and server both encode the same
   checks in the same order with identical messages, which is good. No shared
   module is proposed.
3. **Test oracle:** the whitespace test computes its expected message with the
   same `/\s/u` it is testing
   ([registration.test.js:211-213](../../backend/test/registration.test.js#L211-L213)).
   Two explicit lists (length failures and whitespace failures) would be clearer.
   Adding ` ` to the whitespace list would cover a realistic pasted case.
4. **Error association:** errors appear in a `role="alert"` paragraph above the
   form, but the password input never receives `aria-invalid`. The pattern is
   unchanged from before; consider it during the planned accessibility work.
5. **`onInvalid` message:** "This field must have at least 8 characters." differs
   from the server's "Password must be 8–18 characters." Using one wording would
   be more consistent.
6. **Admin guide:** Atlas free-tier (M0) clusters do not offer Cloud Backup
   snapshots. If the cluster is M0, `mongodump` is the only backup option the
   guide lists. Worth a sentence once the tier is confirmed.

## Guardrail gaps (known list)

- **WORSENED:** no frontend tests. More security-relevant logic now lives in the
  frontend (`validateNewPassword`, `maxLength`, `setCustomValidity`), and finding
  1 is exactly the kind of bug a component test would catch.
- **UNCHANGED:** no automated accessibility checks; no enforced coverage
  threshold; `frontend/dist` still tracked (it contains no password guidance, so
  nothing stale was found); typecheck excludes tests; no duplication detector;
  no Dependabot/CodeQL/secret scanning; no pre-push hook/CODEOWNERS/PR template.
- **RESOLVED (earlier):** registration rate limit exists (5 per 15 minutes per
  IP). Node version declarations were not rechecked in this run.

## Manual checklist

- [ ] Keyboard-only navigation and visible focus: NOT CHECKED
- [ ] Screen reader pass; colour contrast: NOT CHECKED (`aria-describedby`
      wiring confirmed by reading source only)
- [ ] Real browser at mobile and desktop widths: NOT CHECKED. The browser
      truncation behind finding 1 is from the HTML `maxlength` specification
      and browser behaviour, not from a browser run in this review.
- [ ] Live MongoDB/Atlas behaviour: NOT CHECKED (excluded)

**User-reported after the review (2026-10-30):** Shorena reported that the
browser check passed ("all green"). Claude did not observe that run, and the
report did not list which cases were tried. Finding 1 still stands, because it
appears only when a password longer than 18 characters is pasted during
registration. That paste test has not been reported yet.

- [x] Security judgement (policy tradeoff, no email rule at sign-in, no
      trimming): checked by reading source and tests
- [x] UX copy and tone: checked by reading source (findings 2, 3)

## Not checked, and limits

- Audits were not run (excluded). Atlas was not contacted, and no `.env` was read.
- Frontend behaviour was not run in a browser. The custom validity flow, the
  layout of the new `div`/`ul` inside `.field-hint`, and how password managers
  behave with `maxLength` all remain unverified.
- The admin guide's `mongosh` commands were not run. Whether a validator written
  through `mongosh` (numbers stored as doubles) reads back equal in the Node
  driver is expected but unverified. The October 29–30 live check covered a
  driver-created collection only.
- Hosted GitHub Quality results were not queried.

## Proposed fixes

Pick any; none have been applied.

1. **(Finding 1)** Remove the 18-character `maxLength` in registration mode
   ([SignIn.jsx:70](../../frontend/src/account/SignIn.jsx#L70)) so the existing
   error is shown instead of silent truncation. One-line change; manual browser
   check afterwards.
2. **(Finding 2 + 3)** Fix the guidance and error wording: "Not contain your
   email address." and "spaces or other blank characters". Touches `SignIn.jsx`,
   `useSignIn.js`, `registration.js`, and the message assertion in
   `registration.test.js`.
3. **(Finding 4 + 5)** Restore the hash-format assertion, and add a login test for
   a long existing password that contains its own email. Test-only.
4. **(Finding 6 + 7)** Update the progress record (tip, the contradictory
   "pending" line, the 164-test result, the truncation caveat) and the
   admin-guide link label. Docs-only.

Each would be a separate approved step. Sprint 3 remains open until the frontend
invitation workflow is built and reviewed.
