# Quality review: sprint-05-ai-coach, 2026-11-12, scope: commit 1974bf9

Reviewed commit: `1974bf92165311c198424d5e5086e5a5327670a2`
("fix: harden resend rollout and preserve saved responses").
Reviewer: Claude. Read-only review: no code changed, nothing installed, no
network access, no database access, no `.env` read.

`HEAD` is `c417d7b`. The two commits after `1974bf9` change only
`doc/meetings/meeting-5_2026-11-10.md` (`git diff --stat`), so the checks below
ran on `HEAD` and are valid for the `1974bf9` code. The commit's own diff was
read with `git show`.

This review checks two things:

1. The fixes made after
   [the review of 930f044](quality-review-2026-11-04-930f044.md).
2. The MongoDB index clarification recorded in
   [sprint-05-progress.md](sprint-05-progress.md) and
   [invitation-resend.md](invitation-resend.md).

## Summary

| Check                               | Result        | Key detail                                                         |
| ----------------------------------- | ------------- | ------------------------------------------------------------------ |
| `npm run lint`                      | PASS          | No errors or warnings printed. See the exit-code note below.       |
| `npm run format:check`              | PASS          | "All matched files use Prettier code style!"                       |
| `npm run typecheck`                 | PASS          | No errors printed. See the exit-code note below.                   |
| `npm run test:coverage`             | PASS          | exit 0; 319 tests, 319 pass; 100% lines, 97.97% branches, 100% fns |
| Frontend build (scratch `--outDir`) | PASS          | exit 0; built to the scratchpad, tracked `frontend/dist` untouched |
| Three npm audits                    | NOT COMPLETED | Need network access, which this review was told not to use         |
| Mocked Chromium suite               | NOT RUN       | Not requested; this commit changes no frontend code                |
| Real MongoDB indexes/transactions   | NOT CHECKED   | No live access allowed                                             |

Exit-code note: for lint, format and typecheck I read the printed output.
My exit-code capture in the shell did not work (it printed an empty value), so
"PASS" rests on clean output with no error lines. It is not a recorded exit 0.
Coverage and build exit codes were captured properly (both 0).

Shared-config changes in the commit: none. The commit touches `backend/src`,
`backend/test`, `backend/test-support` and `doc/` only.
Files created or changed by the checks: none. `git status --short` was empty
after the checks.

## Measured

Coverage for the changed backend files:

| File                             | Lines | Branches | Functions | Uncovered lines |
| -------------------------------- | ----- | -------- | --------- | --------------- |
| `invitation-pair-storage.js`     | 100   | 94.44    | 100       |                 |
| `invitation-response.js`         | 100   | 96.43    | 100       |                 |
| `invitation-storage.js`          | 100   | 96.97    | 100       |                 |
| `invitation-resend-migration.js` | 100   | 94.74    | 100       |                 |
| `safe-logging.js`                | 100   | 100      | 100       |                 |
| All files                        | 100   | 97.97    | 100       |                 |

- Lines 105-106 of the migration (the "data changed" recheck), which were
  uncovered at `930f044`, are now covered.
- Branch gaps remain in the files above. I did not map each missed branch.
- The measured numbers match what `sprint-05-progress.md` reports: 319 passed,
  100% lines/functions, 97.97% branches.
- Coverage only shows which code ran. The test double says so itself
  (`backend/test-support/resend.js:29-30`): it does not certify MongoDB index
  behavior, write-conflict retries or atomicity.

## Status of the findings from the 930f044 review

| ID  | Original finding                                                  | Status now                                                             |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| B1  | Second `{ pairKey: 1 }` index created before the unique one drops | NOT ACCEPTED by the author, and NOT SETTLED. See F1.                   |
| M1  | Legacy startup could recreate uniqueness on migrated storage      | FIXED in code and tests, against simulated storage only. See M1 below. |
| L1  | A saved decline could return 503 because of the notice lookup     | FIXED in code and tests. One small gap remains. See F2.                |
| L2  | Progress record said the work was uncommitted                     | FIXED. A dated note supersedes the old line; history is kept.          |
| L3  | The "data changed during migration" check had no test             | FIXED. The check is now covered. See L3 below.                         |

### M1 — fixed (judged from source and tests)

- `verifyLegacyInvitationStorage` (`invitation-pair-storage.js:62-74`) refuses to
  start in disabled mode if the `invitationPairs` collection exists or the
  `invitation_pair_history` index exists. This is the check I proposed.
- `prepareInvitations` calls it before the legacy `createIndex`
  (`invitation-storage.js:88-94`), so no index is written when it throws.
- The collection must already exist at that point, because `prepareValidation`
  runs first. `listIndexes` on a missing collection is therefore not a worry.
- The new test (`invitation-storage.test.js:328-356`) covers both markers and
  asserts zero index writes. A second test
  (`invitation-resend-migration.test.js:171-190`) covers the helper directly,
  including a fresh legacy database that must pass with no events.
- The rollback section of `invitation-resend.md` now matches the code. It says
  the refusal applies even before any resend, and that old application versions
  have no such safeguard and must stay stopped.

### L3 — fixed (judged)

The new test (`invitation-resend-migration.test.js:191-202`) adds an invitation
from inside the double's pair-write hook, then asserts that no index event
happened and the legacy unique index is still first. If the recheck at
`invitation-resend-migration.js:102-106` were removed, the index would be
created and the `events` assertion would fail. I reasoned this from the code. I
did not remove the recheck to prove it.

## Findings (judged, most important first)

### F1 — Medium: the B1 question is still open; the docs state the answer more firmly than the evidence allows

- **Where:** `doc/sprint-05/sprint-05-progress.md` (the "Approved resend review
  follow-up" entry), `doc/sprint-05/invitation-resend.md:44-51`, and
  `backend/src/invitation-resend-migration.js:107-109`.
- **What:** the author checked MongoDB's documentation and decided that a basic
  index and a unique index may share the key `{ pairKey: 1 }`. They kept the
  design. `invitation-resend.md` says the manual "explicitly permits" it.
- **What I could and could not verify:**
  - I could not open that page. This review had no network access.
  - My own 930f044 claim was labeled "as far as I know" and was never confirmed.
    I do not claim it is right. I also cannot confirm the author's reading.
  - Neither side has run `createIndex` against a real server. The test double
    accepts any `createIndex`, so tests say nothing either way.
  - Server behavior on index key patterns can depend on the MongoDB version.
    Nothing in the repo records which server version or Atlas tier the
    rehearsal and production use, and the doc text is not tied to a version.
- **Why it matters:** if the author is right, nothing changes. If not, the apply
  step fails. It fails safely (backfilled pointers stay, the legacy index stays,
  no invitations change), but the migration cannot finish.
- **Fix, documentation only:**
  1. Reword the `invitation-resend.md` note from "explicitly permits" to
     something like "per the manual for server version X; to be confirmed in the
     rehearsal".
  2. Add to the rehearsal checklist: record the exact server version, and
     record the result of creating `invitation_pair_history` while
     `invitation_pair_unique` still exists.
  3. Write down the fallback in advance. If the rehearsal rejects the index,
     use a different key pattern such as `{ pairKey: 1, createdAt: -1, _id: -1 }`
     and update `verifyResendStorage`.
- **Judgment on the decision itself:** declining to teach the double a rule that
  nobody has confirmed is reasonable. Keeping the rehearsal as the real test
  is correct. The remaining risk is a doc claim that reads as settled.

### F2 — Low: the notice-lookup catch is broader than its test

- **Where:** `backend/src/invitation-response.js:86-103`, test at
  `backend/test/invitation-resend.test.js:285-313`.
- **What:** `serializeResponse` now catches every error from
  `currentDeclineIds`. That includes the pair-integrity errors (missing pointer,
  dangling pointer, corrupt decline date) that fail closed with a 503 elsewhere.
  On the response path these now return 200 without the notice and write a safe
  log entry. That fits the intent, since the decision is already saved. The only
  tested failure is a synchronous throw from `find`. Integrity failures and a
  rejected `toArray()` are not tested.
- **Why it matters:** low. The behavior is safe: no data is wrong and the
  notice is optional. It is not shown to be what the code does in those cases.
- **Fix (optional):** add one case with a dangling pointer, asserting 200, no
  `resendPolicy`, and the logged `invitation-response-notice` operation. The
  test also reads `f.state.logs[0]` by position; asserting on the matching entry
  would be sturdier.

### F3 — Low (decision to record): a partial migration now blocks legacy restarts

- **Where:** `invitation-storage.js:88-94`, `invitation-resend.md` rollback
  section.
- **What:** once the migration has created `invitationPairs`, a legacy-mode
  start is refused until someone decides what to do. A migration that fails
  after that point (for example the "data changed" stop) leaves exactly that
  state. This is the intended fail-closed behavior, and the doc states it. The
  trade-off is availability: a legacy-mode restart during a failed migration
  will not start.
- **Why it matters:** the migration procedure requires writers to be stopped, so
  this should only occur during the maintenance window. The operator should know
  it before the window, not during it. The check is also check-then-act and not
  atomic, which is acceptable with stopped writers.
- **Fix:** none needed in code. Add one line to the rehearsal and runbook
  checklist: "if apply fails after pair storage exists, the app will not start
  in legacy mode; follow the recovery section".

### F4 — Low (optional): repeated test stubs

- **Where:** `backend/test/invitation-storage.test.js` (six copies of
  `listIndexes: () => ({ toArray: async () => [] })`, plus five copies of
  `filter.name === 'invitationPairs' ? null : ...` branching in
  `listCollections`), and one copy each in
  `authentication-integration.test.js` and `invitation-cookie-integration.test.js`.
- **What:** eight stub copies. The commit itself had to touch four test files
  because startup gained one more read.
- **Fix (optional):** one small shared "empty legacy storage" helper in
  `backend/test-support/`. This meets the rubric's 3+ real uses. It is not worth
  doing if the tests are about to change anyway.

### Checked with no defect found (source reading)

- Default-off behavior: the only change on the disabled path is the extra
  read-only guard before the same unique `createIndex`. Nothing is written
  before the guard passes.
- Safe logging: `invitation-response-notice` was added to the operation type
  (`safe-logging.js:22`). The test asserts the synthetic error text never
  appears in the logs.
- Idempotent retry after a failed notice lookup: the test shows the retry
  returns 200, keeps the same `respondedAt`, and now carries `decline-30-days`.
- Docs: the rollback, disabled-startup and notice-failure text in
  `invitation-resend.md` matches the code. The progress record's numbers match
  the measured run.
- Node declarations: `.nvmrc` is `26.0.0`; `engines.node` is `>=26.0.0 <27` in
  all three manifests; local Node is v26.0.0.

## Guardrail gaps (known list)

No gap is NEW or WORSENED by this commit. All other gaps are UNCHANGED and were
not re-verified item by item in this run:

- No automated accessibility checks.
- No frontend tests (the Playwright specs are mocked-API browser tests).
- No enforced coverage threshold.
- `frontend/dist` tracked in Git.
- Typecheck excludes tests, test-support and config files. This matters here:
  the changed test and test-support code is not type-checked.
- No duplication detector (see F4).
- No Dependabot, CodeQL or secret scanning.
- No pre-push hook, CODEOWNERS or PR template.
- No rate limit on `/api/auth/register`.

The Node-version consistency check, which the template asks to be repeated each
review, passed (see above).

## Manual checklist

- [ ] Keyboard-only navigation and visible focus: NOT CHECKED
- [ ] Screen reader pass; color contrast: NOT CHECKED
- [ ] Real browser at mobile and desktop widths: NOT CHECKED
- [ ] Live MongoDB/Atlas behavior: NOT CHECKED
- [ ] Security judgment (rate limiting, email enumeration, secrets): NOT CHECKED
- [ ] UX copy and tone: NOT CHECKED

## Verification limits

- The three npm audits were not run (network).
- I did not open MongoDB's documentation (network), so F1 is not decided.
- No live MongoDB or Atlas check. Index creation, transactions, snapshot
  reads, write-conflict retries and the exact conflict behavior are untested
  against a real server. Every pass above uses simulated storage.
- I did not rerun the mocked Chromium suite. This commit changes no frontend
  code, so the earlier 122-test result is historical, not a fresh result.
- I did not run mutation checks (for example removing the recheck or the guard)
  to prove the new tests fail when the code is wrong. That is reasoning only.
- Lint and typecheck results come from clean output, not a captured exit code.
- Manual accessibility, browser and security checks were not done.
- I did not re-verify the unchanged guardrail gaps one by one.

## Readiness

The code fixes for M1, L1, L2 and L3 look correct and are tested within the
limits of the simulated storage. Nothing in this commit blocks a
separately approved rehearsal on a **disposable replica set**, as long as the
rehearsal records the server version and the same-key index result (F1).
Atlas and production activation remain gated on the rehearsal evidence listed
at the end of the 930f044 review. This review does not replace any of it.

## Proposed fixes (waiting for Shorena's choice)

1. **F1 (doc only):** reword the index note as version-dependent and add the
   version and same-key index result, plus the fallback key, to the rehearsal
   checklist. Files: `invitation-resend.md`, `sprint-05-progress.md`. Cost:
   a few lines.
2. **F3 (doc only):** add the "failed apply blocks legacy restart" line to the
   rehearsal and runbook checklist.
3. **F2 (optional test):** add a dangling-pointer case for the response path,
   and match the log entry by operation instead of by position.
4. **F4 (optional):** extract the repeated empty-storage stub into one helper.
