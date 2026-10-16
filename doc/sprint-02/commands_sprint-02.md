# CallingIn — Sprint 02 Commands

Run from the CallingIn project root on `sprint-02-authentication`.
Run each command separately and stop if it fails.

## Initialize Sprint 02 planning on GitHub

```bash
npm run check
git add doc/sprint-02/
npm run precommit
git commit -m "docs: initialize Sprint 02 planning"
git push -u origin sprint-02-authentication
```

- `npm run check` runs lint, formatting checks, backend tests, and the frontend build.
- `git add doc/sprint-02/` stages only Sprint 02 documentation, including this file.
- `npm run precommit` checks matching staged files before committing.
- `git commit` saves the staged changes locally. The commit hook also runs automatically.
- `git push -u` uploads the sprint branch and sets its upstream on GitHub.

If planning was already committed and pushed, do not repeat that initialization
commit. For later changes, use a commit message describing the actual work.
Pushing this branch does not merge it into `main`.

## Publish later Sprint 02 documentation changes

```bash
npm run check
git add doc/sprint-02/
npm run precommit
git commit -m "Describe the new changes"
git push
```

This stages documentation only. Backend implementation changes must also be
reviewed and staged separately when ready. The student handles Git submissions.

## Step-by-step work record

### 1. Prepare Sprint 02

Created `sprint-02-authentication` from main and added the progress plan,
AI development log, and this commands/work-record file under `doc/sprint-02/`.

### 2. Set up MongoDB Atlas

Created the CallingIn project and development cluster in Atlas. The setup
instructions covered creating a database user, allowing the current public IP,
and obtaining the Node.js connection string. Atlas hosts the database;
the application still runs locally.

### 3. Install the MongoDB driver

Ran from the CallingIn root:

```bash
npm --prefix backend install mongodb
```

Installed `mongodb` 7.7.0. This updated `backend/package.json` and
`backend/package-lock.json` and installed the package in `backend/node_modules/`.
The installation audit reported zero known vulnerabilities.

### 4. Prepare private database settings

The backend folder already existed. Created `backend/.env` and updated
`backend/.env.example` with configuration placeholders:

```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=callingin_dev
```

Real connection settings belong only in `backend/.env`, which Git ignores.
The tracked `.env.example` must contain placeholders only. Credentials were
briefly placed in the example; it was restored to placeholders. The exposed
password needs resetting in Atlas, with the updated string saved privately in
`.env`. Password reset and a successful live connection are not yet confirmed.

### 5. Add connection code

The `backend/src/` folder now contains:

| File          | Purpose                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `app.js`      | Defines Express and the health endpoint; existed before this step.                                          |
| `server.js`   | Connects and pings MongoDB before opening the HTTP port; closes the connection on shutdown.                 |
| `database.js` | Reads settings, validates placeholders, connects to the chosen database, and hides sensitive driver errors. |

The `backend/test/` folder contains:

| File               | Purpose                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `health.test.js`   | Existing tests for the health response and an unknown route returning 404.                                                                        |
| `database.test.js` | Four new tests for missing settings, successful connect/ping/close, and safe cleanup on connection or ping failure. Uses test doubles, not Atlas. |

### 6. Verify the work

Commands for checking the application:

```bash
npm run check
```

At the connection-code check, lint, all six backend tests, and the frontend
build passed individually. The combined check stopped because this document
needed formatting. The live Atlas check stopped because private settings still
contained a placeholder; it did not establish a connection.

To format this work record, then rerun the full check:

```bash
npx --no-install prettier --write doc/sprint-02/commands_sprint-02.md
npm run check
```

### 7. Verify the live Atlas connection

The student confirmed resetting the exposed password. The agent connected and
pinged Atlas successfully, then closed the connection without creating records.
The student ran the same check and reported success.

From `backend/`, run:

```bash
node --env-file=.env --input-type=module -e 'import { connectDatabase } from "./src/database.js"; try { const connection = await connectDatabase(); console.log("Atlas connection and ping passed."); await connection.close(); } catch (error) { console.error(error.message); process.exitCode = 1; }'
```

Use `-e` for this one-shot command; `--input-type=module` cannot be used with
Node's interactive REPL. Credentials remain in private `.env`.

### 8. Implement backend registration

Added `POST /api/auth/register` with display name, email, and password input.
Display names are trimmed and limited to 1–80 characters; emails are trimmed,
lowercased, and validated; passwords must be 15–128 characters.

- `backend/src/registration.js` validates requests, hashes passwords with a
  random salt and Node's built-in `scrypt`, and inserts accounts into MongoDB.
- `backend/src/app.js` adds JSON parsing, the registration route, and safe
  error responses for malformed or oversized requests.
- `backend/src/server.js` prepares a unique email index before listening.
- `backend/test/registration.test.js` adds seven tests covering successful
  registration, validation, duplicate emails, unavailable storage, safe error
  responses, salted hashes, and unique-index setup.

Registration returns public account fields only, with HTTP 201 on success,
400 for invalid input, 409 for duplicate email, and 503 for unavailable storage.
The test for oversized requests checks HTTP 413. No new packages were installed.

```bash
npm run check
```

After implementation, the complete check passed: ESLint, Prettier, all 13
backend tests, and the frontend build. Registration tests used simulated
storage; registration against Atlas and real unique-index enforcement have not
been verified. No Atlas accounts were created during these tests.

### Next step — review professor feedback

The student has new professor feedback to share. Further implementation will
wait while we review that feedback and agree on a revised plan. Login, logout,
sessions, protected profile endpoints, and frontend account forms remain pending.

The student handles staging, commits, pushes, and the eventual sprint merge.
Add future commands and short explanations as each step is completed.

## October 16, 2026 — Consolidate shared quality tools

Moved ESLint, its shared configuration packages, React lint plugins, and Prettier
into the root package. The frontend retains React/Vite; the backend retains
Express/MongoDB. All three package manifests and lockfiles remain necessary.

Replaced the two app-level ESLint configuration files with root
`eslint.config.mjs`. Common rules, including complexity 10, are defined once;
React/browser and backend Node.js rules remain scoped to the appropriate files.
No new lint rules were added in this step. Updated lint-staged to use root ESLint.

Install all packages from the project root when setting up a fresh checkout:

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

Root dependencies are now required for app-level lint and format commands.
Normal commands remain available:

```bash
npm run check
npm --prefix frontend run lint
npm --prefix backend run lint
npm --prefix frontend run format:check
npm --prefix backend run format:check
```

For files the student has staged, `npm run precommit` uses the shared root tools.
The agent did not stage, commit, push, or merge this consolidation.

## October 16, 2026 — Function complexity and size limits

Kept cyclomatic complexity at 10 and added shared ESLint limits: nesting depth
4, parameters 4, and 60 lines per function excluding comments and blank lines.
The limits apply to frontend and backend code, including their JavaScript tests.

The existing frontend `App` exceeded the line limit. Split it into a
`useBackendConnection` hook, `Welcome` and `ProjectStatus` components, and a
smaller `App`. The original request timeout, cancellation, retry behavior,
page content, and styles were retained. Backend functions needed no refactoring.

```bash
npm run lint
npm run check
```

Accessibility-plugin setup is deferred: `eslint-plugin-jsx-a11y` 6.10.2 declares
ESLint support only through version 9. ESLint 9 is end-of-life, so the project
keeps ESLint 10 without forcing installation or claiming accessibility linting
is active. This compatibility finding is separate from the implemented limits.

## October 16, 2026 — Backend coverage reporting and missing tests

Run from the CallingIn root:

```bash
npm run test:coverage
```

Or from `backend/`:

```bash
npm run test:coverage
```

The root command delegates to the backend. Node's built-in runner uses
`--experimental-test-coverage` with `--test-coverage-include="src/**/*.js"`.
No Vitest migration, extra dependency, coverage threshold, or CI change was made.
`npm run check` still runs regular tests; coverage is a separate command.

The first 13-test report omitted server.js entirely, so its high total was not
representative of all source files. Added seven tests for database configuration,
constructor/cleanup failures, safe generic HTTP errors, and isolated startup
failures. Extracted the existing error middleware as `handleError` so it can be
tested directly; HTTP behavior remains unchanged.

The final report includes all four source files and all 20 tests pass:

| File            | Lines  | Branches | Functions |
| --------------- | ------ | -------- | --------- |
| app.js          | 100%   | 100%     | 100%      |
| database.js     | 100%   | 100%     | 100%      |
| registration.js | 100%   | 100%     | 100%      |
| server.js       | 27.45% | 75%      | 40%       |
| Overall         | 81.22% | 98.15%   | 84.21%    |

Remaining gaps: successful server startup, index-setup failure, port-listening
failure, and shutdown paths in server.js. These need controlled lifecycle tests;
no real Atlas records or credentials were used for the new tests. Coverage
means execution, not proof that every input or behavior is correct. Thresholds
will be agreed after reviewing these gaps rather than hiding untested files.

Also completed the earlier duplication refactor: health and registration tests
share `backend/test-support/server.js` for temporary-server startup and cleanup.

## October 16, 2026 — Server lifecycle tests

Moved startup/shutdown behavior into `backend/src/lifecycle.js` so tests can
supply a simulated database and process interface. `backend/src/server.js`
remains the executable entry point. The application still connects and prepares
the unique email index before listening.

Added ten tests in `backend/test/lifecycle.test.js` for successful startup,
connection/index failures, failed setup cleanup, a real occupied localhost port,
SIGINT/SIGTERM shutdown, repeated stop calls, cleanup failures, and a stalled
shutdown deadline. Signal/deadline tests use a controlled process interface;
they do not terminate the test runner or prove behavior on every operating system.

Startup errors close the database; normal shutdown closes HTTP and MongoDB,
removes signal handlers, and clears the shutdown timer. Repeated stop calls share
the same promise. Port errors are sanitized before being reported.

```bash
npm run test:coverage
npm run check
```

The lifecycle coverage run passed all 30 tests and measured 100% lines, branches,
and functions across all five backend source files. This supersedes the earlier
81.22% line-coverage baseline. No coverage threshold is enforced. Tests use
simulated database connections, not Atlas accounts or real user records;
coverage does not establish complete behavior or live database integration.

## October 16, 2026 — Accessibility setup deferred

I will discuss accessibility tooling with Professor Lionelle before installing
anything. Playwright plus axe-core was proposed as an automated alternative to
the currently incompatible JSX accessibility lint plugin. The proposed setup
needs both `@playwright/test` and `@axe-core/playwright`, plus a test-browser
download. A free axe DevTools browser extension is a simpler manual alternative.

No installation commands were run and no `npm run test:a11y` script exists yet.
See the [Sprint 02 progress record](sprint-02-progress.md) for requirements,
tradeoffs, and questions for the professor. Further setup needs my approval.

## October 16, 2026 — JavaScript type checking

Installed TypeScript 7.0.2, `@types/node`, and `@types/express` as root development
tools. React type definitions already existed in the frontend. Application
source remains `.js`/`.jsx`; no migration to TypeScript source was made.

- `tsconfig.base.json` enables `allowJs`, `checkJs`, `strict`, and `noEmit`.
- `frontend/tsconfig.json` checks frontend source with browser/Vite/React types.
- `backend/tsconfig.json` checks backend source with Node.js/Express/MongoDB types.
- JSDoc documents component props, connection state, database connections,
  request fields, callbacks, and lifecycle dependencies.

Run from the CallingIn root:

```bash
npm run typecheck
npm run check
```

`npm run check` now runs lint, formatting, type checking, backend tests, then
frontend build. No application files are generated by the type checker.
Only application source under `frontend/src/` and `backend/src/` is checked;
tests, configuration files, and dependency declaration internals are outside
this initial scope (`skipLibCheck` skips checking library declarations).

Small runtime safety changes accompany the annotations: guard a missing React
root element, normalize the HTTP port to a number, and narrow caught errors
before reading their code. Added a regression test for non-Error storage failures.
Runtime HTTP validation remains necessary; static types do not validate incoming
network data or replace tests. An intentional temporary wrong-argument probe
confirmed the checker rejects a number passed as a password; the probe was removed.

The coverage run passed 31 tests and still measured 100% backend lines, branches,
and functions. No coverage threshold, GitHub workflow, or accessibility package
was added. The agent did not stage, commit, push, or merge.

## October 16, 2026 — GitHub continuous integration

Added `.github/workflows/quality.yml`. After it is committed and pushed, GitHub
runs the **Quality / Quality checks** job for pushes to main/sprint branches and
pull requests targeting main. Manual runs become available once the workflow
exists on the default branch. No deployment or automatic merge is configured.

The job installs all three lockfiles with `npm ci`, then runs lint, formatting,
JavaScript type checking, backend tests with coverage, frontend build, and all
three dependency audits. It uses Node 26.0.0, matching local verification, and
read-only repository permissions. Official checkout/setup-node revisions are
pinned. Husky is disabled on the CI runner; the explicit checks still run.
No Atlas connection, database secrets, or real account records are needed.

Coverage is reported without an enforced minimum. Audits fail on reported
vulnerabilities by npm's default policy; new advisories may fail a future run
without source changes. Review findings rather than automatically applying fixes.

### Finish setup after the student pushes

1. Review and commit the workflow and related documentation on this sprint branch.
2. Push and open the repository's **Actions** tab. Wait for **Quality checks**
   to finish successfully; local checks do not prove the hosted run passed.
3. In repository **Settings**, open **Rules / Rulesets** (or **Branches** for
   classic protection). Use a rule targeting `main`; preserve existing protections.
4. Require pull requests and passing status checks. Select the successful
   **Quality checks** check, using GitHub Actions as its source where available.
5. Consider requiring branches to be up to date before merging. Review bypass
   permissions so the intended protection is actually enforced. Do not require
   another reviewer's approval unless a reviewer is available for this project.
6. Save/activate the rule and confirm a pull request shows the required check.

Plan, visibility, and repository permissions affect available protection features.
Required-check settings have NOT been changed by creating this workflow.
The local GitHub CLI currently has invalid authentication; no remote settings
were changed. Configure the rules through the browser after the first green run,
or reauthenticate the CLI before requesting help with remote settings.

I still stage, commit, and push myself. A passing push check does not undo or
reject an existing commit; required rules prevent failing work from being merged
into main. Source workflow and required-rule setup are separate steps.

References: [GitHub required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
and [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
