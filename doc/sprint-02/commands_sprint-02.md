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
