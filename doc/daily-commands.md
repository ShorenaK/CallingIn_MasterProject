# CallingIn — Daily Commands and Sprint Completion

Run commands from the root of the checkout you intend to change. Use the branch shown in your terminal or IDE before staging or pushing. `main` holds shared records and completed
sprint documents; sprint branches hold their sprint work.

## 1. Start the application

Use `sprint-01-planning` while developing and checking Sprint 01. Use `main`
to run the integrated application after a sprint has been merged, and to update
shared meeting records, the daily guide, and the project journey. Both branches
have frontend and backend development scripts; starting a server does not
require switching branches. Run checks on the branch whose work you are verifying.

The command is `npm run dev`, not `npx run dev`. There is no root `dev` script.
Start each application from its own folder, or use the root commands below.

**Terminal 1 — backend, from the normal project checkout:**

```bash
cd /Users/shorenaanzhilov/Desktop/CallingIn/backend
npm run dev
```

**Terminal 2 — frontend, from the normal project checkout:**

```bash
cd /Users/shorenaanzhilov/Desktop/CallingIn/frontend
npm run dev
```

**Terminal 3 — checks and Git, from the project root:**

```bash
cd /Users/shorenaanzhilov/Desktop/CallingIn
```

If working in another checkout, replace the root path with that checkout's path.
The separate main checkout is currently `/private/tmp/CallingIn-main-docs`;
it needs its own dependency installation before running application checks.

Alternatively, from the project root, use these in two separate terminals:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

Open <http://127.0.0.1:5173/>. Stop each server with Ctrl+C.
With both running, check the frontend proxy:

```bash
curl --fail http://127.0.0.1:5173/api/health
```

Expected: `{"status":"ok"}`.

## 2. Review and run all project checks

```bash
git status
git diff
npm run check
```

`npm run check` runs these in order and stops on failure:

| Command                | What it checks                    |
| ---------------------- | --------------------------------- |
| `npm run lint`         | Frontend and backend ESLint rules |
| `npm run format:check` | Repository Prettier formatting    |
| `npm test`             | Backend automated tests           |
| `npm run build`        | Frontend production build         |

A passing check verifies those checks, not every possible application behavior.
Run the browser smoke test too when application behavior changes.

After cloning or dependency changes, install locked dependencies:

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

What these install commands do:

- `npm ci` installs root tools using the exact versions in the root
  `package-lock.json` and activates Husky through the `prepare` script.
- `npm --prefix frontend ci` installs frontend dependencies, including React
  and Vite, using the frontend lockfile.
- `npm --prefix backend ci` installs backend dependencies, including Express,
  using the backend lockfile.

Each command replaces that folder's existing `node_modules/`. These commands
install dependencies; they do not commit, push, or merge.

The root tools in simple terms:

- **Prettier:** Keeps spacing and formatting consistent. A check reports
  differences; `--write` applies formatting changes.
- **Husky:** Connects Git hooks to project commands.
- **lint-staged:** Runs configured checks on matching files staged for commit,
  keeping the pre-commit checks focused and fast.
- **Commit hook:** An automatic check before Git creates a commit. Here,
  Husky runs `npm run precommit`, which uses lint-staged to run ESLint and
  Prettier checks. A failed check blocks the commit until the issue is fixed.

The root install runs `prepare` to activate Husky. Inspect its configuration:

```bash
git config --get core.hooksPath
cat .husky/pre-commit
```

Expected hook path: `.husky/_`; hook command: `npm run precommit`.

## 3. Fix reported failures

Read the error first. These commands apply formatting changes:

```bash
npm --prefix frontend run format
npm --prefix backend run format
npx --no-install prettier --write doc/daily-commands.md doc/project-journey.md
```

For other documents, replace the paths. Fix ESLint or test failures in the
reported files, review `git diff`, and rerun `npm run check`. Do not bypass hooks
to hide failures.

## 4. Stage, check the hook, commit, and push on main

Continue only when your terminal or IDE shows `main` and the changes
are intended for `main`. Review new files too; `git diff` does not show them.

```bash
git add .
git diff --cached --stat
git diff --cached
git diff --cached --check
npm run precommit
```

`git add .` includes all non-ignored changes under the current directory.
`npm run precommit` runs lint-staged checks on matching staged files. With no
matching files it skips work; that does not demonstrate the checks passed.
Let it finish before editing. If it fails, fix the files, stage corrections,
and rerun it. The hook also runs automatically on commit.

```bash
git commit -m "Action was done"
git push origin main
git status
```

Replace `Action was done` with a specific description whenever possible.
Run commands separately; stop if any fails. A final clean status and successful
push confirm the local changes were committed and uploaded.

## 5. Finish each sprint

Replace `sprint-01-planning` with the actual sprint branch. Start there, update
its progress and AI log, review changes, then run:

```bash
npm run check
git add .
git diff --cached
npm run precommit
git commit -m "docs: finish Sprint 01 records"
git push origin sprint-01-planning
git status
```

Stop on failure. If nothing changed, no new commit is needed. Before switching,
the working tree must be clean. Do not discard uncommitted work to make it clean.

## 6. Merge a sprint while preserving main records

Use the normal checkout, after finishing its sprint changes. Do not merge
while another linked worktree has `main` checked out; finish that worktree's
documentation changes and remove the clean worktree first.

```bash
git switch main
git pull --ff-only origin main
git status
git merge --no-ff --no-commit sprint-01-planning
```

The merge stops before creating a commit. If conflicts appear, inspect both
versions and resolve them deliberately. Do not accept all incoming changes:
sprint branches intentionally omit shared documents that must remain on main.
To abandon an in-progress merge, use `git merge --abort`.

For the current Sprint 01 merge, retain main's shared records using its
pre-merge `HEAD` (run only during the uncommitted merge on main):

```bash
git restore --source=HEAD --staged --worktree -- doc/meetings/ doc/archive/ doc/sprint-plan.md doc/CS8674_Project_Proposal_and_Semester_Plan_Shorena_Anzhilov.pdf doc/daily-commands.md doc/project-journey.md
```

These paths must already exist in main before merging. For future sprints,
review this list against main's shared records and include any new shared files.
The restore intentionally keeps main's versions of those records. If a sprint
contains a useful update to them, compare it and apply that update separately.

```bash
git diff --cached --name-status
git diff --cached --diff-filter=D --name-only
git status
```

Confirm meetings, planning, proposal, archives, daily guide, and journey remain.
Keep sprint documents under their own folder. Review any duplicate meeting files
at `doc/` root and retain useful content in `doc/meetings/` before removing duplicates.
Resolve remaining conflicts and stage each resolved file. Update the project
journey on main with the actual sprint outcome and verification results.

```bash
npm run check
git add doc/project-journey.md
npm run precommit
git diff --cached --check
git diff --cached
git status
```

Continue only when all conflicts are resolved and checks pass:

```bash
git commit -m "Merge Sprint 01 and preserve shared project records"
git push origin main
git status
```

If Git reports already up to date, there is no merge to commit. Do not delete
sprint branches as part of this process unless you decide to do so separately.

## 7. Record the actual handoff status

After assistant file edits, when accurate, report:

**Nothing was staged, committed, pushed, or merged by the assistant.**

Existing user-staged changes may still be present. This statement describes the
assistant's actions, not whether the Git index is empty. Once you execute Git
commands, record what actually succeeded; do not repeat the statement as though
your commit, push, or merge never happened.

Update [Project Journey](project-journey.md) briefly each week and after sprint
completion: changes, learning, checks, Git status, and next step.

## 8. Folder structure

Shared application structure (simplified; `node_modules/` is generated locally
by installation and is not committed):

```text
CallingIn/
├── README.md
├── package.json
├── package-lock.json
├── node_modules/
├── .husky/
│   └── pre-commit
├── .lintstagedrc.json
├── .prettierrc.json
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   └── test/
│       └── health.test.js
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
├── public/
├── materials/
└── doc/
```

`main` documentation in the separate checkout, before the Sprint 01 merge:

```text
doc/
├── daily-commands.md
├── project-journey.md
├── sprint-plan.md
├── CS8674_Project_Proposal_and_Semester_Plan_Shorena_Anzhilov.pdf
├── meetings/
│   ├── meeting-01_2026-09-15.md
│   ├── meeting-02_2026-09-29.md
│   └── meeting-3_2026-10-12.md
├── archive/
│   ├── 1st_README.md
│   └── 2nd_README_FALL_2026.md
└── sprint-01/
    ├── ai-development-log-1.md
    ├── sprint-01-progress.md
    ├── Notes_testing_qualitygate.md
    └── images/
        └── smoke-test-2026-10-12.png
```

`sprint-01-planning` documentation after the approved organization:

```text
doc/
└── sprint-01/
    ├── ai-development-log-1.md
    ├── sprint-01-progress.md
    ├── commands_sprint-01.md
    ├── notes_testing_qualitygate_sprint-01.md
    └── images/
        └── smoke-test-2026-10-12.png
```

After the reviewed sprint merge, main should retain its shared records and use
the organized Sprint 01 filenames. Future completed sprints get their own
`doc/sprint-NN/` folders on main.
