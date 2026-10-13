# CallingIn Frontend

React with JavaScript and Vite. See the [project README](../README.md)
for CallingIn’s scope and semester plan.

## Install and run

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

Open http://127.0.0.1:5173/. The welcome page checks `/api/health` through
Vite’s development proxy, which forwards `/api` requests to Express at
http://127.0.0.1:3001. Use the default backend port for this configuration.
Stop each server with Ctrl+C in its terminal.

The page uses the existing logo at `../public/images/logo1.png`.
Accounts, AI assistance, invitations, and messaging are not implemented.

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

The build writes to `frontend/dist/`.

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

Tests use Node’s built-in test runner and temporary localhost ports.
They verify the health endpoint’s HTTP status, JSON content type and body,
and that an unknown API route returns 404. No database or AI service is needed.

Lint, formatting checks, both backend tests, and the frontend production
build should pass before review.

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
