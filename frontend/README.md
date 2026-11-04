# CallingIn Frontend

React with JavaScript and Vite. See the [project README](../README.md)
for CallingIn’s scope and semester plan.

The invitation composer includes optional AI Coach controls for drafting from
intent or refining Your message. Suggestions are separately editable and only
replace the message through Use suggestion; Send invitation remains explicit.
Current normal startup has no real AI provider connected, so generation returns
Coach unavailable. Browser tests use mocked suggestions, not OpenAI calls.

## Install and run

Shared lint and formatting tools are installed at the repository root.
Install them once before using quality commands:

```bash
npm ci
```

From the repository root, install the frontend dependencies and start Vite:

```bash
cd frontend
npm ci
npm run dev
```

In a second terminal, from the repository root, start Express:

```bash
cd backend
npm ci
npm start
```

Open http://127.0.0.1:5173/. Vite’s development proxy forwards `/api` requests
to Express at http://127.0.0.1:3001. Use the default backend port for this
configuration. The welcome page no longer makes a health request; the health
endpoint remains available for an explicit check. Stop each server with Ctrl+C.

The app uses the logo at `../public/images/logo1.png`. Accounts, invitations,
private conversations, and Social Battery are implemented. Accepted invitations
offer Open conversation; messages and partner availability refresh manually.
Social Battery is saved by its owner and does not block communication. AI
assistance remains future work.

Configure the backend using the project README before starting it; runtime
startup needs MongoDB and the account-session/origin settings.

## Verification commands

With both servers running, check the backend through the frontend proxy:

```bash
curl http://127.0.0.1:5173/api/health
```

Expected JSON: `{"status":"ok"}`.

From `frontend/`, create a production build:

```bash
npm run build
```

The build writes to `frontend/dist/`. For review, use a scratch directory to
preserve the tracked build output, for example from the repository root:

```bash
npm --prefix frontend run build -- --outDir /private/tmp/callingin-review-build --emptyOutDir
```

## Code quality

Run these commands inside either `frontend/` or `backend/`:

```bash
npm run lint
npm run format:check
```

ESLint checks JavaScript, including a function complexity limit of 10.
The frontend also checks React hooks and Fast Refresh exports. Prettier
checks formatting; use `npm run format` to apply formatting changes.
The shared formatting settings live in `../.prettierrc.json`.

From `backend/`, run the HTTP endpoint tests:

```bash
npm test
```

Backend tests use Node’s built-in test runner and temporary localhost ports.
They cover accounts, sessions, invitations, conversations, messages, Social Battery,
and failure paths using simulated database methods. No live Atlas or AI service
is needed for these tests.

From the repository root, also run:

```bash
npm run typecheck
npm run test:coverage
npm run test:e2e
```

Playwright uses Chromium with mocked APIs and includes accessibility scans.
Record those results separately from real backend/database and human checks.
Lint, formatting, type checks, relevant test suites, and a scratch production
build should pass before review. Current evidence and remaining live/manual
checks are in the [Sprint 4 progress notes](../doc/sprint-04/sprint-04-progress.md).

## Pre-commit checks

From the repository root, install the hook tools:

```bash
npm ci
```

The root `prepare` script activates Husky locally. Install dependencies in
both `frontend/` and `backend/` as shown above as well. Each collaborator
must install the tools after cloning; Git does not activate hooks by itself.

When you run `git commit`, Husky runs `npm run precommit`. lint-staged runs
ESLint on staged frontend/backend JavaScript and Prettier checks on staged
JavaScript, JSON, CSS, HTML, Markdown, and YAML. Lockfiles and generated
output are excluded from formatting checks. Images are not checked.

Checks do not auto-format your files. A failure stops the commit: fix the
reported issue, review your changes, stage them yourself, and try again.
For formatting, use `npm run format` inside the appropriate application,
or `npx --no-install prettier --write path/to/file` from the root for a
specific documentation or configuration file.

lint-staged temporarily hides unstaged edits in partially staged files and
uses a backup stash by default. This allows it to check the staged version;
let the command finish before editing or staging more files.

Builds and endpoint tests remain separate commands to keep the hook fast.
You can run `npm run precommit` from the root to check files you have staged
without creating a commit. With no staged files, it skips checks.
