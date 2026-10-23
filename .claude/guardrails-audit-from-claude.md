# CallingIn guardrails audit (from Claude)

Original audit date: 2026-10-16. Read-only review of code, package scripts, lint
rules, tests, documentation, Git hooks, and GitHub workflows. Statuses below are
from that date; see "Updates since" at the end.

## What existed

| Area                 | Status                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lint                 | ESLint with `--max-warnings 0`; `complexity` 10, `max-depth` 4, `max-params` 4, `max-lines-per-function` 60; React hooks and react-refresh rules; Prettier conflicts off |
| Format               | Prettier, checked repo-wide locally and in CI                                                                                                                            |
| Types                | `tsc` with `strict` and `checkJs` in both apps                                                                                                                           |
| Tests                | Backend only, `node --test`; 31 tests; 100% line, branch and function coverage measured                                                                                  |
| Git hooks            | Husky `pre-commit` running lint-staged (ESLint and Prettier check on staged files)                                                                                       |
| CI                   | `quality.yml` with SHA-pinned actions, `contents: read`, concurrency, timeout, and `npm audit` for all three packages                                                    |
| Documentation        | README, sprint notes, daily commands                                                                                                                                     |
| Secrets hygiene      | `.env*` gitignored, `.env.example` allowed                                                                                                                               |
| Manual accessibility | Good markup (`lang`, labelled sections, `role="status"`, meaningful `alt`), but nothing automated                                                                        |

## What was missing or drifting

1. No automated accessibility checks (no `eslint-plugin-jsx-a11y`, no axe).
2. No frontend tests.
3. Coverage measured but no enforced floor.
4. `frontend/dist/` tracked in Git (3 files) despite being gitignored.
5. Typecheck covered `src/` only, not tests, `test-support`, or config files.
6. No duplication detector.
7. No file-level size or cognitive-complexity rules.
8. No Dependabot, CodeQL, secret scanning, or dependency review.
9. Narrow hooks: no pre-push, no commit-message convention; branch protection
   not visible from the repository.
10. No CODEOWNERS, PR template, `.nvmrc`/`engines`, or `CLAUDE.md`.
11. README drift: test description and `check` step list did not match reality.
12. No rate limit on `/api/auth/register`; scrypt is expensive. No security
    headers or request logging. Registration reveals which emails exist (409).

## Recommendations (prioritized)

### P1: high value, low effort

- **A. Untrack `frontend/dist/`.** `git rm -r --cached frontend/dist`. Confirm
  nothing deploys from the committed copy.
- **B. `eslint-plugin-jsx-a11y`.** Catches missing alt text, bad ARIA and
  unlabeled controls at lint time. Later found to declare ESLint support only
  through version 9 (see updates).
- **C. Coverage threshold in CI.** Node's `--test-coverage-lines`,
  `--test-coverage-branches` and `--test-coverage-functions` flags. Choose a
  floor (about 90%, or 100%).
- **D. Widen typecheck** to tests, `test-support`, and `vite.config.js`.
- **E. Fix README drift.**

### P2: valuable, moderate effort

- **F. Dependabot** for npm in three directories plus GitHub Actions.
- **G. Frontend tests** with Vitest, Testing Library and `vitest-axe`. No browser
  download, but jsdom cannot check color contrast.
- **H. Duplication check** with jscpd; measure first, gate later.
- **I. CodeQL** workflow for JavaScript.
- **J. Pre-push hook** running typecheck and tests.
- **K. Rate limit** on `/api/auth/register` with `express-rate-limit` or a
  concurrency cap around scrypt.

### P3: nice to have

- **L. gitleaks** secret scan.
- **M. `.nvmrc` and `engines`.**
- **N. Extra ESLint rules:** `max-lines`, sonarjs cognitive complexity,
  `no-console`.
- **O. Governance files:** PR template, CODEOWNERS, branch protection on `main`.
- **P. `helmet` security headers and `dependency-review-action`.**
- **Q. `CLAUDE.md`** with commands and rules.

## Proposed plan

1. Batch 1: A, C, D, E, M (config only).
2. Batch 2: B, then F.
3. Batch 3: G, then H as measurement only.
4. Batch 4: I, K, L, then P.
5. Batch 5: J, N, O, Q.

Each batch is its own step; the user stages and commits.

## Updates since (as of 2026-10-23)

- M done: `.nvmrc` and `engines.node` exist.
- Q done: `CLAUDE.md` and the `/quality-review` skill exist.
- B blocked: `eslint-plugin-jsx-a11y` 6.10.2 declares ESLint support only through
  version 9. A throwaway trial under ESLint 10 with `--legacy-peer-deps` loaded
  and flagged 4 sample violations, but that setup is unsupported. Accessibility
  tooling is deferred pending discussion with Professor Lionelle.
- Item 4 is worse: `frontend/dist` now has 4 tracked files.
- Items 1, 2, 3, 5, 6, 8 and 12 remain open as of the latest review; login now
  has a rate limit, registration still does not.
