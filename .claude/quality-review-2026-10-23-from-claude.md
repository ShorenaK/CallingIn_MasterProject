# Quality review: sprint-02-authentication, 2026-10-23

Scope: files changed vs `main`, focused on backend authentication. This is an
intermediate review, not the final Sprint 02 review. Frontend account flows and
profile/password-change features are unfinished and out of scope. No Atlas
access, no `.env` files read, no edits made.

## Summary

| Check                                 | Result | Key detail                         |
| ------------------------------------- | ------ | ---------------------------------- |
| `npm run lint`                        | PASS   | exit 0, `--max-warnings 0`         |
| `npm run format:check`                | PASS   | all files match Prettier           |
| `npm run typecheck`                   | PASS   | frontend and backend `tsc`, exit 0 |
| `npm run test:coverage`               | PASS   | 77 of 77 tests pass                |
| Frontend build (temp `--outDir`)      | PASS   | built in 185 ms to the scratchpad  |
| `npm audit` (root, frontend, backend) | PASS   | 0 vulnerabilities in each          |

- Shared config changed vs `main`: yes (`eslint.config.mjs`, `tsconfig*`,
  `package.json` files, CI workflow, `.lintstagedrc.json`). Project-wide checks
  covered everything.
- Files changed by the checks: none (`git status --short` empty).
- Process note: the first loop of lint, format and typecheck failed because of a
  shell quoting mistake and was rerun; the results above are from the rerun. One
  scratch file was written to `/tmp` and deleted.

## Measured: coverage (line / branch / function)

All files: 98.78% lines, 99.45% branches, 95.92% functions.

| File                 | Result                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `app.js`             | 93.94% lines, 92.31% branches; uncovered lines 21-24 (partial-config throw) |
| `lifecycle.js`       | 96.58% lines; uncovered lines 86-90 (default `prepareAuthentication`)       |
| `authentication.js`  | 100% lines; one function never runs: `.catch(() => {})` callback, line 99   |
| Other 7 source files | 100% on all three measures                                                  |

Coverage shows what ran, not that behavior is correct.

## Findings, ordered by severity (judged, not tool output)

| #   | Severity              | Where                                                                                                 | Finding                                                                                               | Failure scenario                                                                                                                                                                           | Fix  |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 1   | Medium                | `app.js:36`, `registration.js:12-18`                                                                  | `/api/auth/register` has no rate limit; each call runs a 128 MB scrypt                                | A script sending the correct `Origin` and JSON headers fires many parallel registrations; memory and CPU are exhausted. Login is limited, registration is not.                             | 1    |
| 2   | Medium (future)       | `session.js:22-29`                                                                                    | Store uses connect-mongo default `stringify: true`; sessions saved as JSON text                       | Password change must invalidate all of a user's sessions, but a `userId` filter cannot match inside a string. Cheaper to fix before real sessions exist.                                   | 2    |
| 3   | Medium (unverified)   | `session.js:42`, `login-rate-limit.js:16`, `session.test.js:128`                                      | `secure` cookie in production with proxy trust deliberately off                                       | Behind a TLS-terminating proxy express-session sends no cookie: login returns 200 but never persists. Rate limit also keys every user to the proxy IP.                                     | 3    |
| 4   | Medium                | `session.test.js`, `authentication-integration.test.js` (~line 107)                                   | "Keep me signed in" cookie lifetime never asserted                                                    | Tests only check `Expires=` exists. A persistent cookie set to 1 day would pass; 90 days is asserted for the stored record only.                                                           | 4    |
| 5   | Low-Medium            | `lifecycle.js:86-90`, `test/lifecycle.test.js:210`                                                    | Real `prepareAuthentication` wiring never runs in tests                                               | A wiring mistake between origin protection, session middleware and database passes all 77 tests. Live Atlas startup covered the happy path once, by hand.                                  | 4    |
| 6   | Low-Medium            | `authentication.js:95, 118, 152`, `registration.js`                                                   | Every `catch` discards the error with no server log                                                   | A MongoDB outage or scrypt failure appears only as a generic 503 with nothing to diagnose from.                                                                                            | 5    |
| 7   | Low                   | `registration.js` (hash and validators), `password.js:9, 24-30, 39-44`, `authentication.js:11, 14-27` | Duplication: password policy (15-128), email pattern, scrypt parameters and hash format in 2-3 places | A cost mismatch is caught by the real-hash round trip in `password.test.js:14`; a policy change is not. Relaxing registration to 12 characters still leaves login rejecting them with 400. | 6    |
| 8   | Low                   | `authentication.js:98-100`                                                                            | A store failure during login destroys the existing session                                            | A signed-in user logging in again during a session-store hiccup is silently signed out.                                                                                                    | 5    |
| 9   | Low                   | `app.js:7-11`, `authentication.js:60-63`, `password.js:17-19`, `session.test.js:50`                   | Four stale comments                                                                                   | They say startup "will supply both next", protections are "planned", and "login comes later"; all are done.                                                                                | 7    |
| 10  | Low (design tradeoff) | `login-rate-limit.js:22-31`, `app.js:41`                                                              | Login limit is per IP and counts successful logins                                                    | Users behind one school or office address share 10 logins per 15 minutes; a distributed attack on one account is not limited.                                                              | none |

### Implemented and working (with test evidence)

- Origin and JSON protection runs before body parsing; missing and opaque
  origins are rejected.
- Login does not reveal whether an email exists: unknown emails still pay the
  scrypt cost with a dummy hash, and error responses are identical.
- Session is regenerated on login; `userId` is written after regeneration.
- Logout destroys the server session before clearing the cookie; a failed
  destroy is not reported as success; a replayed old cookie returns 401.
- Anonymous requests set no cookie and store no session.
- A deleted account loses its session on `/me`.
- No response contains `passwordHash` or private error text (tested).
- Startup closes the shared MongoDB client if authentication setup fails.

### Not implemented yet (future, not defects)

- Password change invalidating all sessions.
- Profile editing and frontend account flows.
- Session secret rotation.

## Meaningful test gaps

1. Persistent cookie lifetime is not asserted (finding 4).
2. Real startup wiring is not run (finding 5).
3. Integration tests use a hand-written MongoDB fake
   (`authentication-integration.test.js:25-56`, documented in the test
   comments): connect-mongo's real queries, the TTL index and Atlas permissions
   are not exercised. Live login and logout are unverified.
4. Session fixation is not tested end to end: unit tests confirm `regenerate` is
   called, but no test sends a login with a pre-existing cookie and checks the
   session ID changes.
5. No test links the registration and login password policy (finding 7).
6. The partial-configuration guard in `app.js` has no test.
7. `registration.test.js` was not reviewed in depth; whether registration is
   tested through the full app with origin protection on is unconfirmed.

## Documentation and comments

- Comments mostly explain why and are worth keeping. The problem is the four
  stale ones (finding 9). No new comments are needed.
- README and sprint docs were not rechecked against the code in this run.

## Guardrail gaps (known list)

NEW or WORSENED: none beyond finding 1, the same gap as before but more
important now that login is limited and registration is not.

UNCHANGED:

- No automated accessibility checks.
- No frontend tests (`frontend/src` has no test files).
- No enforced coverage threshold (`test:coverage` only reports).
- `frontend/dist` still tracked in Git: 4 files, up from 3 in the first audit.
- Typecheck still excludes tests, `test-support`, and vite/eslint configs.
- No duplication detector.
- No Dependabot, CodeQL or secret scanning (only `quality.yml` in `.github`).
- No pre-push hook, CODEOWNERS or PR template.

RESOLVED: Node declarations. `.nvmrc` and `engines` exist; runtime v26.0.0
matches `.nvmrc`.

## Manual checklist

All NOT CHECKED unless noted.

- [ ] Keyboard-only navigation and visible focus
- [ ] Screen reader pass; color contrast
- [ ] Real browser at mobile and desktop widths
- [ ] Live MongoDB/Atlas behavior. Reported by the user: live startup, health,
      unauthenticated `/me` and clean shutdown passed. Live login and logout
      remain unverified. Not verified by this review.
- [ ] Security judgment (rate limiting, email enumeration, secrets). The
      judgments above are not a security audit. Registration still reveals which
      emails exist through its 409 response.
- [ ] UX copy and tone

## Recommended fixes (pick any; none applied)

### Fix 1: Limit registration

- What: add a rate limiter to `/api/auth/register` with its own limit.
- Why: closes finding 1.
- How: reuse the `express-rate-limit` pattern in a small shared helper, mounted
  before `register` in `app.js`; add tests like `login-rate-limit.test.js`. A
  cap on concurrent scrypt operations is an alternative.
- Files: `app.js`, a new or generalized limiter module, a test.
- Impact: no new package. Per-IP, with the same shared-address tradeoff as
  finding 10.

### Fix 2: Decide how sessions are found by user

- What: set `stringify: false` in the store options, or store a separate
  `userId` field.
- Why: makes "invalidate all sessions on password change" a single `deleteMany`.
- How: one option line in `session.js`, plus updating the test fakes, which
  currently expect a stored string record.
- Files: `session.js`, `session.test.js`, `authentication-integration.test.js`.
- Impact: do it before real sessions exist; existing sessions would be
  invalidated, so timing is the owner's decision. Verify against real
  connect-mongo, which the fake MongoDB cannot do.

### Fix 3: Decide the deployment topology

- What: settle how production terminates TLS.
- Why: the `secure` cookie and the per-IP rate limit both depend on it
  (finding 3).
- How: if a proxy is used, configure `trust proxy` for that exact hop, add a
  test, and update the limiter comment.
- Files: `app.js`, `session.js`, docs.
- Impact: nothing needed until a host is chosen; a documented decision for now.

### Fix 4: Close the test gaps

- What: four tests: persistent cookie `Expires` about 90 days out (absent for
  browser-session cookies); the real `prepareAuthentication` run against the
  fake database; login with a pre-existing cookie changing the session ID; the
  partial-configuration guard.
- Why: these are the real gaps listed above.
- How: extend existing test files using the existing fake-database helpers.
- Files: `session.test.js`, `authentication-integration.test.js`,
  `lifecycle.test.js`, an app test.
- Impact: tests only; no production code.

### Fix 5: Log failures safely

- What: log the error name and code from the `catch` blocks, never the message
  or request data; stop destroying an existing session when login fails before
  regeneration.
- Why: findings 6 and 8.
- How: pass the existing `logger` through or use a fixed `console.error` format;
  add a test that logged output contains no `passwordHash` or connection string.
- Files: `authentication.js`, `registration.js`, `app.js`, tests.
- Impact: small; care needed that logged fields cannot carry secrets.

### Fix 6: Share the password policy and scrypt settings

- What: one small module for the password length rule, email pattern, scrypt
  parameters and hash format.
- Why: finding 7; three real users justify extraction.
- How: `registration.js`, `password.js` and `authentication.js` import from it.
- Files: a new module plus the three above.
- Impact: touches security-sensitive code; keep hash behavior byte-identical
  and rely on the real-hash round-trip test.

### Fix 7: Update the four stale comments

Comment text only, in `app.js`, `authentication.js`, `password.js` and
`session.test.js`.

## Questions for the owner

1. Which fixes to implement? Suggested order of value: 1, 4, 2, 5, 6, 7, 3.
2. For Fix 2: are there any real user sessions yet, or only test data?
3. Is the per-IP login limit that counts successful logins acceptable
   (finding 10), or should it be per account or exclude successes?
