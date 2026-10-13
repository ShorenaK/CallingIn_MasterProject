# CallingIn — Sprint 01 Commands

Unless stated otherwise, run commands from the project root (`CallingIn/`).
Use `pwd` to see your current folder and `cd ..` to move up one folder.

## Start the application

Open two terminals, both starting in the project root.

**Terminal 1 — backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Open <http://127.0.0.1:5173/> in your browser. The backend runs on port
`3001`. Localhost means your own computer. Keep both terminals running;
press **Ctrl+C** in each to stop the servers.

If you prefer to stay in the root folder, use these commands in separate
terminals instead:

# Prettier

npx prettier --write .

# ESLint

npx eslint . --fix

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

Choose either approach; do not start duplicate servers. If a port is
already in use, stop the existing server in its terminal first.

The backend message `.env not found. Continuing without it.` is normal:
the optional file is absent and the backend defaults to port `3001`.

## Check your work

Use a third terminal at the project root while the servers are running.

```bash
git status
git diff
```

`git status` shows the current branch and changed files. `git diff` shows
unstaged changes to tracked files; review new files in your editor too.

Run the quality checks before committing:

```bash
npm --prefix frontend run lint
npm --prefix backend run lint
npm --prefix frontend run format:check
npm --prefix backend run format:check
npm --prefix backend test
npm --prefix frontend run build
```

- **Lint:** checks JavaScript for code problems.
- **Format check:** reports formatting differences without changing files.
- **Test:** checks the backend health response and unknown-route behavior.
- **Build:** creates frontend production files in `frontend/dist/`; it does not deploy.

With both servers running, check the frontend-to-backend connection:

```bash
curl --fail http://127.0.0.1:5173/api/health
```

Expected response: `{"status":"ok"}`.

## Fix formatting

These commands rewrite formatting, so review the changes afterward:

```bash
npm --prefix frontend run format
npm --prefix backend run format
```

For a specific documentation file, from the root:

```bash
npx --no-install prettier --write doc/sprint-01/commands_sprint-01.md
```

Replace the file path to format another document.

## Stage, commit, and push

From the project root, review your changes and confirm the intended branch:

```bash
git status
git diff
```

Your requested shortcut is:

```bash
git add . && git commit -m " " && git push
```

Replace the blank space between the quotes with a meaningful commit message
before running it. For example:

```bash
git add . && git commit -m "Document daily development commands" && git push
```

- `git add .` stages all new, modified, and deleted non-ignored files under
  the current folder. Run from the root to include the whole project.
- `git commit -m "..."` records the staged changes locally and runs the
  pre-commit hook. A blank message may be rejected.
- `git push` uploads commits to the configured remote branch.
- `&&` runs the next command only if the previous command succeeds. If the
  hook fails, the push will not run; fix the issue, review, and stage again.

For a chance to review the exact staged changes before committing, use
these commands separately instead of the shortcut:

```bash
git add .
git diff --cached
npm run precommit
git commit -m "Describe your changes"
git push
```

`npm run precommit` checks staged files without creating a commit. The hook
also runs automatically during `git commit`. Let lint-staged finish before
editing files or changing what is staged.

The current `sprint-01-planning` branch already tracks
`origin/sprint-01-planning`. If a branch has no upstream, its first push
needs `-u`; for this sprint the command is:

```bash
git push -u origin sprint-01-planning
```

## Install dependencies when needed

These are setup commands, not required every morning. Run after cloning or
when dependency lockfiles have changed:

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

`npm ci` installs the locked dependency versions. The root installation also
activates Husky for this clone.

See the [project README](../../README.md) for the complete setup instructions.
