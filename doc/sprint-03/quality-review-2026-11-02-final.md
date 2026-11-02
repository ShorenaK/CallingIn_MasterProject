# Quality review: sprint-03-invitations, 2026-11-02, scope: full (final Sprint 3)

**Reviewer:** Claude (independent review; no application code changed)
**Commit reviewed:** `2f916d6`, plus uncommitted `doc/sprint-03/sprint-03-progress.md`
**Branch:** `sprint-03-invitations` (not switched)
**Inputs read:** `AGENTS.md`, `.claude/skills/quality-review/` (SKILL, rubric,
template), `.codex-memory/` index/state/decisions, `git show main:doc/deferred-tasks.md`,
all of `backend/src`, the Sprint 3 backend tests, `frontend/src/invitations`,
`frontend/src/account/api.js`, `frontend/e2e`, `package.json`/lockfile, README,
and the Sprint 3 docs.

Deferred and out of scope for this review, per the request and the deferred list:
the 30-day re-invitation feature, envelope/emoji work, palette changes, and broader
copy cleanup. The current rule is still one invitation per pair, permanently, and I
reviewed against that rule.

## Summary

| Check                         | Result        | Key detail                                                                    |
| ----------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `npm run lint`                | PASS          | `--max-warnings 0`, exit 0                                                    |
| `npm run format:check`        | PASS          | "All matched files use Prettier code style!"                                  |
| `npm run typecheck`           | PASS          | frontend and backend `tsc`, exit 0                                            |
| `npm run test:coverage`       | PASS          | 176 tests, 176 pass, 0 fail/skip/cancelled                                    |
| Scratch build                 | PASS          | `vite build --outDir <scratchpad>/build`; tracked `frontend/dist` not touched |
| `npx playwright test`         | PASS          | 31/31 Chromium; APIs mocked; `--output` sent to scratchpad                    |
| `npm audit` (root)            | NOT COMPLETED | Network check not approved for this run                                       |
| `npm --prefix frontend audit` | NOT COMPLETED | Network check not approved for this run                                       |
| `npm --prefix backend audit`  | NOT COMPLETED | Network check not approved for this run                                       |

**Shared-config changes vs main:** `package.json` (Playwright/axe dev dependencies,
`minimatch` overrides, e2e scripts), `package-lock.json`, `eslint.config.mjs`,
`.github/workflows/quality.yml`, `.gitignore`, `.prettierignore`, and the new
`playwright.config.js`. These affect unchanged code too. Lint, format, and typecheck
passed over the whole repository.

**Files created or changed by checks:** `git status --short` before and after:
only ` M doc/sprint-03/sprint-03-progress.md`, which was already modified before the
review. Playwright regenerated the Git-ignored `playwright-report/` at the repo root.
`frontend/dist` is unchanged; its one ignored stray asset is dated October 16.

## Measured

Backend coverage (`node --test --experimental-test-coverage`, `src/**/*.js`):

| File                     | Line % | Branch % | Func % |
| ------------------------ | ------ | -------- | ------ |
| authentication.js        | 100.00 | 98.70    | 100.00 |
| invitation-creation.js   | 100.00 | 96.15    | 100.00 |
| invitation-listing.js    | 100.00 | 93.33    | 100.00 |
| invitation-pagination.js | 100.00 | 93.55    | 100.00 |
| invitation-response.js   | 100.00 | 95.83    | 100.00 |
| recipient-lookup.js      | 100.00 | 93.33    | 100.00 |
| all other src files      | 100.00 | 100.00   | 100.00 |
| **All files**            | 100.00 | 98.36    | 100.00 |

The report shows no uncovered lines. The partial branches in the six files above
are mostly defensive `!db`/type-narrowing paths. The coverage tool doesn't name the
exact branches. Coverage covers backend `src` only. Frontend code is exercised only
by the mocked Playwright suite, and no coverage is collected for it.

Playwright: 31 passed in 35.6 s: account 6, invitations 15, send-invitation 10
(`frontend/e2e/*.spec.js`). Every invitation view tested is scanned with axe for
WCAG 2/2.1 A/AA and 2.2 AA tags (`frontend/e2e/helpers.js:27-32`), with no exclusions.

`npm ls minimatch --all`: one copy, `minimatch@11.0.1`, used by both `eslint@10.13.0`
and `@eslint/config-array@0.23.5`. Their declared ranges are `^10.2.5` and `^10.2.4`
(`node_modules/eslint/package.json:162`, `node_modules/@eslint/config-array/package.json:56`).

No command failed.

### Evidence quality: mocked vs. live

| Area                                        | Evidence this run                                               | Kind                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Lookup, creation, lists, pagination, names  | Handler tests + real-HTTP cookie integration test               | Real Express/session middleware; **simulated** MongoDB collections                           |
| Recipient-only responses, duplicates        | Handler tests, including concurrent accept/decline              | **Simulated** `findOneAndUpdate`; MongoDB's single-document atomicity is assumed, not tested |
| 5,000 limit                                 | Policy unit tests; Playwright counter/limit test                | Unit + **mocked** browser API                                                                |
| Validator startup checks                    | `invitation-storage.test.js` (3,000/6,000/missing/race)         | **Simulated** `listCollections`/`createCollection`                                           |
| Login limits                                | Limiter tests (stub handler) + auth integration via `createApp` | Real `express-rate-limit` memory store; **simulated** users/sessions                         |
| Cancel draft, focus, a11y                   | Playwright keyboard/focus tests + axe                           | Real Chromium; **mocked** APIs                                                               |
| Atlas, Safari, VoiceOver, zoom, phone width | None this run                                                   | Not verified                                                                                 |

## Judged (my reading, not tool output)

I found no blocking defects in the Sprint 3 scope. Authorization is scoped by the
server-verified account ID everywhere: `require-account.js:26-36`,
`invitation-listing.js:35`, and `invitation-response.js:41-44`. A cursor never
replaces that identity. Response transitions can't be overwritten:
`invitation-response.js:50-55` allows deferred only from pending, and a final status
only from pending or deferred. A repeated request with the same status returns 200
without writing. Senders, outsiders, and missing IDs all get the same 404. Duplicate
prevention relies on the unique `pairKey` index (`invitation-storage.js:82-85`), so a
race between two creates is decided by MongoDB and the loser gets a 409.

The message limit is safe across all three layers. Frontend and backend both count
the trimmed text in JavaScript UTF-16 code units (`invitation-policy.js:18-22`,
`frontend/src/invitations/api.js:16-17`). MongoDB's `maxLength` counts code points,
which are never more than code units, so anything the app accepts also passes the
validator. Startup refuses to run if the stored validator differs, rather than
weakening it (`invitation-storage.js:35-49`).

| #   | Severity                 | file:line                                                       | Finding                                                                                                                                                                                                                                              | Why it matters                                                                                                                                                                  | Proposed fix                                                                                                                                                                                |
| --- | ------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Medium                   | `README.md:503-508`                                             | "Running the Project" says login, sessions, profile endpoints, and frontend account forms "are not yet implemented" and that invitations "remain planned".                                                                                           | This is the first description readers see of the current app. It contradicts Sprints 2 and 3, and it would be merged into `main`.                                               | Rewrite this paragraph to describe what is implemented now: accounts, sessions, invitations, and responses. Conversations remain future work.                                               |
| 2   | Medium                   | `README.md:103-107`, `379-387`, `592-594`                       | The response table says Accept "Opens a private conversation". The test descriptions list no invitation coverage. Line 592 lists only health, registration, and startup tests.                                                                       | Today Accept only records consent (see `InvitationCard.jsx:55-58`). The test descriptions undersell what is covered and don't say what is mocked.                               | Change Accept to "Records consent; conversations come later". Add invitations to both test lists, and keep the note about mocked/simulated storage.                                         |
| 3   | Medium                   | `doc/sprint-03/browser-accessibility-testing.md:34-46`, `67-70` | "Current checks" lists only the account screens, says "The setup does not add invitation UI", and asks Claude to add invitation tests later.                                                                                                         | These tests now exist: 25 invitation tests with axe scans. This is already a known closeout item in the deferred list. I'm recording it so it isn't lost.                       | Replace the "Current checks" list with the invitation coverage (lookup, compose, counter, cancel/discard, lists, pagination, responses, expiry), and keep the paragraph on limitations.     |
| 4   | Low                      | `frontend/src/invitations/useSendInvitation.js:38`, `66-70`     | Change person keeps the written message. If the session has expired, the next Find person calls `onSessionExpired()` immediately. That unmounts the panel and throws away the draft without warning.                                                 | The send path deliberately keeps the draft so it can be copied (`:98-109`). The lookup path doesn't, so the two paths behave differently, and the user can lose a long message. | When a message exists, turn a 401 on lookup into the same expired problem notice instead of calling `onSessionExpired()` straight away. Add one Playwright test for it.                     |
| 5   | Low                      | `frontend/src/invitations/useInvitationList.js:51-70`, `78-99`  | When the Sent list reloads after a send (`reloadKey`), an in-flight Show more isn't cancelled. If it finishes after the reload, it appends an old page and overwrites `nextCursor`.                                                                  | This is a narrow race that needs a click on Show more just before Send finishes. The result could be a stale cursor or skipped items until refresh. No test covers it.          | Reset `more` and ignore loadMore results that started before the latest reload, using a request counter or version check. Or accept the risk and record it.                                 |
| 6   | Low (accepted trade-off) | `backend/src/login-rate-limit.js:38-50`                         | The per-email failure allowance applies across all IPs. Anyone who knows an email can block that account's sign-in for 15 minutes with 10 wrong passwords, and can repeat it. The 100-per-IP ceiling is shared behind NAT, such as a campus network. | This is documented and approved (progress notes, Nov 2), and it is a reasonable choice at this scale. I list it so the decision is explicitly carried into deployment planning. | No Sprint 3 change. Before deployment, consider showing the email-limit message only after a correct password, or adding a soft delay. Revisit along with the shared store and proxy trust. |
| 7   | Low                      | `package.json:33-40`                                            | The `minimatch` 11.0.1 override crosses a major version: ESLint asks for `^10.2.x`. Lint passed this run, so ESLint works today. Audits weren't rerun here.                                                                                          | An upstream ESLint update could change glob behaviour, or the override could become unnecessary.                                                                                | Keep it. Add "remove override when ESLint ships a patched minimatch range" to the deferred list, and rerun the 3 audits (network, with approval) before merge.                              |
| 8   | Info                     | `frontend/src/invitations/format.js:16-17`                      | The approved sender Maybe Later label is the only status label that ends in a full stop. "please wait" may also read as "loading".                                                                                                                   | Raise this only during the deferred copy cleanup (item 4). The wording is approved and correctly tested at `invitations.spec.js:137`.                                           | No change now. Bring it to the copy review.                                                                                                                                                 |

### Duplication

- `lookup-rate-limit.js`, `invitation-rate-limit.js`, and `registration-rate-limit.js`
  share about 80% of their options. Each differs in key, limit, and message, and is
  about 20 lines. A shared factory would save very little, so I am **not** proposing
  one.
- `/^[a-f0-9]{24}$/` appears in creation, response, pagination, require-account, and
  the frontend `api.js`. This is trivial and stable, so I'm not proposing a fix.
- Tests: `invitation-response.test.js` and `invitation-cookie-integration.test.js`
  each build their own fake collections. The duplication is moderate. It keeps each
  file readable and doesn't hide which behaviour differs.

### Documentation

Findings 1–3 above. The uncommitted progress notes (`sprint-03-progress.md:689-750`)
are accurate. They separate rerun checks from historical ones, state that storage was
simulated and APIs mocked, and don't claim live verification. One older entry,
`:565`, still says the Maybe Later UI "remain[s] pending". It is superseded by
`:675-688`, which is fine in an append-only log.

### Tests (success/failure gaps)

- Every Sprint 3 behaviour has both success and failure tests: invalid input,
  missing storage, 401/404/409/429/503, malformed server data, and concurrency.
  The assertions check status codes, bodies, stored state, the number of writes,
  log contents, focus, and visible text.
- `invitation-response.test.js:197-206` (concurrent accept/decline) shows the handler
  makes the right decisions against a fake that serializes calls. It **would not**
  catch a real atomicity problem, because that guarantee belongs to MongoDB.
- No live check exists of `verifyExistingValidation` against a real validator
  returned by Atlas. Numeric type round-trips are the risky part: the 5,000 value
  saved by mongosh or Compass. The deferred list already tracks this (two startups
  per database).
- Frontend: no unit tests, and no coverage is measured. The e2e suite is not part of
  `npm run check` (it runs in CI only).
- Not covered: finding 4 (draft lost on lookup expiry) and finding 5 (reload/loadMore
  race).

## Guardrail gaps (known list)

**NEW / WORSENED:** none.

**UNCHANGED**

- No enforced coverage threshold.
- `frontend/dist` is tracked in Git despite being in `.gitignore`.
- Typecheck covers `src/**` only (`frontend/tsconfig.json:10`,
  `backend/tsconfig.json:9`). Tests, test-support, e2e specs, and configs are
  excluded.
- No duplication detector.
- No Dependabot, CodeQL, or secret scanning (`.github/` has only `workflows/quality.yml`).
- No pre-push hook, CODEOWNERS, or PR template (`.husky/` has `pre-commit` only).

**RESOLVED (fully or partly)**

- Automated accessibility checks: **partly resolved.** Playwright + axe scan every
  invitation view tested. There is still no jsx-a11y lint rule.
- Frontend tests: **partly resolved.** There are 31 Chromium e2e tests against mocked
  APIs. There are no unit tests or frontend coverage.
- Rate limit on `/api/auth/register`: **resolved.** 5 per 15 minutes per IP
  (`registration-rate-limit.js:10-23`, `app.js:49`), mounted before hashing.
- Node versions: consistent. `.nvmrc` is `26.0.0` and `engines` is `>=26.0.0 <27`
  in all three manifests.

## Manual checklist (NOT CHECKED unless verified this run)

- [ ] Keyboard-only navigation and visible focus. **NOT CHECKED** manually. Automated
      Playwright focus/keyboard tests passed, and `index.css:30` defines
      `:focus-visible`.
- [ ] Screen reader pass (VoiceOver) and colour contrast. **NOT CHECKED**. axe
      contrast rules passed in Chromium only.
- [ ] Real browser at mobile and desktop widths, 200% zoom, Safari. **NOT CHECKED**.
- [ ] Live MongoDB/Atlas behaviour: 5,000 validator accepted at startup on
      `callingin_dev` and `callingin_sprint03_verify`, backup evidence, and two
      startups per database. **NOT CHECKED**.
- [ ] Live login limits after a backend restart: 10 failures per email, 100 per IP,
      and a success not consuming the allowance. **NOT CHECKED**.
- [ ] Live Cancel draft → Keep writing / Discard draft and focus in the running app.
      **NOT CHECKED**. Mocked Chromium tests passed.
- [ ] Live 5,000 / 5,001-character send. **NOT CHECKED**.
- [ ] Security judgment: lockout trade-off (finding 6), lookup enumeration accepted
      by design (10 lookups per 15 minutes per account), and secrets. Code reviewed
      only. **NOT CHECKED** live.
- [ ] UX copy and tone. Deferred by decision. **NOT CHECKED**.
- [ ] Hosted GitHub Quality result for `2f916d6`. **NOT CHECKED** (network).

## Not checked

- All three npm audits, the hosted CI status, and any network or registry call.
  These need your approval.
- `.env` files, Atlas, and any live database. Not accessed, as instructed.
- The 30-day re-invitation, envelope/emoji, palette, and copy cleanup. Deferred by
  scope decision.
- Account-screen code outside the Sprint 3 diff was not re-reviewed line by line.
  The full check suite was still run over it.

## Sprint 3 readiness recommendation

**Ready for closeout after documentation fixes and the listed live checks. No code
blockers.**

The implementation meets the Sprint 3 requirements I reviewed. It enforces identity
on the server for every invitation route, makes final responses irreversible, blocks
duplicates permanently, keeps the 5,000-character limit consistent across all three
layers, and applies the approved two-part login limits. Its automated tests are broad
and outcome-focused. That evidence is all simulated or mocked. I recommend:

1. **Before merge:** fix documentation findings 1–3. Rerun the three audits and
   confirm the hosted Quality run (both need network approval).
2. **Before declaring Sprint 3 complete:** do the live checks in the manual checklist,
   especially the Atlas validator startup on both databases, live login limits, and
   Cancel draft. Or record each one as an accepted limitation.
3. **Optional, can be deferred:** findings 4 and 5 (small frontend robustness fixes).
   Finding 6 is a deployment-planning note. Finding 7 should be added to the
   deferred list.

## Proposed fixes

Each item needs separate approval. None has been applied.

1. **README current-state rewrite** (findings 1–2).
   - What: update `README.md:503-508`, the Accept row at `:105`, and the test
     descriptions at `:379-387` and `:592-594`.
   - Why: they describe the app as it was before Sprint 2.
   - Tradeoff: docs only. The README is shared with `main`, so coordinate with the
     merge.
2. **Browser/accessibility guide refresh** (finding 3).
   - What: rewrite "Current checks" and the outdated Claude instructions in
     `doc/sprint-03/browser-accessibility-testing.md`.
   - This is already a closeout task.
3. **Keep the draft on lookup session expiry** (finding 4).
   - How: in `useSendInvitation.js` `find()`, when `message.trim()` is non-empty and
     the status is 401, set the expired problem instead of calling
     `onSessionExpired()`. Add a Playwright test.
   - Tradeoff: small. The user has to click "Sign in again".
4. **Guard the Show more / reload race** (finding 5).
   - How: in `useInvitationList.js`, keep a load version that the reload effect
     increments, discard loadMore results from an older version, and reset `more`
     on reload.
   - Tradeoff: about 6 lines and one more test. Accepting the risk is also
     reasonable.
5. **Record the minimatch override exit condition** (finding 7).
   - What: add a line to `main:doc/deferred-tasks.md`.
   - Rerun the audits with your network approval.

Waiting for your choice.
