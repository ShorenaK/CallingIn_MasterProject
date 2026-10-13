# AI Development Log

## Entry 01 — Starter Application

**Date:** 2026-09-29
**Tool and model:** OpenAI Codex, GPT-6
**Branch:** sprint-01-planning
**Purpose:** Set up the React and Express foundation

### Prompt:

---

Help me set up Sprint 1 for CallingIn, my CS 8674 Fall 2026 project.

First inspect the repository, current branch, git status, and project
documentation. Do not change files or run installation commands until
you explain your plan and I approve it.

Branch workflow:

- Use sprint-01-planning.
- If it already exists locally or remotely, reuse it.
- If it does not exist, propose creating it from an up-to-date main.
- Preserve all uncommitted work.
- Do not create future sprint branches yet.
- Do not commit, push, merge, or delete anything without my approval.

Stack:

- React with JavaScript, using Vite.
- Node.js with Express.
- MongoDB will be integrated in a later step.
- Do not use TypeScript or Rust.

After approval, build the starter incrementally:

1. Create frontend/ and backend/ without overwriting existing work.
2. Create a simple CallingIn welcome page with the existing teal-and-orange
   branding. Inspect existing images before choosing assets.
3. Add an Express GET /api/health endpoint.
4. Connect the frontend to that endpoint using a Vite development proxy.
5. Configure ESLint and Prettier.
6. Propose a fast pre-commit setup, explaining what it runs before adding it.
7. Add a meaningful health-endpoint test and verify the frontend build.
8. Add .gitignore and safe example environment files where needed.
9. Document installation, run, and verification commands.

Scope:
The MVP is AI-assisted communication. Trusted Circle is future work.
Do not implement authentication, database integration, AI requests, or
private messaging in this starter. Do not show unfinished features as working.

Important:

- Read materials/check-rs.md only as reference; do not execute its Rust commands.
- Explain each small step briefly so I can learn.
- Ask before editing or running commands; group related actions for approval.
- Report what actually passed verification and anything still incomplete.
- Do not deploy the application.

---

### Result:

Built the JavaScript application foundation, with a branded welcome page,
an Express health endpoint, a Vite proxy, quality tools, tests, and setup
instructions. The application is a starter, not the completed semester MVP.

### Steps completed on September 29, 2026

#### 1. Inspect and agree on scope

Read the repository, current documentation, branch state, and design images.
The existing `logo1.png` was selected for the teal-and-orange branding.
Read `materials/check-rs.md` only as reference; no Rust commands were run.
At initial inspection, local and remote main matched. The user subsequently
reported being on `sprint-01-planning` with a clean working tree.

Read-only commands included `git status --short --branch`, `git branch -a`,
`git remote -v`, `git log`, and `git ls-remote --heads origin main sprint-01-planning`.
These identify local changes, branches, repository remotes, and remote commits.
The user retained responsibility for branch creation, staging, commits, and pushes.

#### 2. Create the frontend and backend

Ran `npm create vite@latest frontend -- --template react --no-interactive`,
then `npm install` inside `frontend/`. The React template creates the browser
application; Vite provides the development server and production build.

Created a private backend package and ran `npm install express` in `backend/`.
Express handles HTTP requests. `src/app.js` defines the application separately
from `src/server.js`, which opens the listening port. This separation lets
tests start their own server without starting the normal development server.

The original Vite template included Oxlint. It was later removed in favor of
the requested ESLint setup. No TypeScript application or Rust source was added.

#### 3. Add the welcome page and health endpoint

Replaced the template demo with a CallingIn introduction and existing logo.
The page clearly identifies future features as unavailable. It includes
connection loading, success, error, timeout, and retry behavior.

Added `GET /api/health`, returning HTTP 200 with `{"status":"ok"}`.
This confirms the backend responds; it does not test a database or AI service.
Configured `frontend/vite.config.js` so `/api` requests go to Express on
`127.0.0.1:3001`. The browser can use a relative URL instead of a backend URL.

Ran `npm start` in the backend and `npm run dev` in the frontend. Used curl
against both `http://127.0.0.1:3001/api/health` and
`http://127.0.0.1:5173/api/health` to check direct and proxied responses.
Both returned HTTP 200 and the expected JSON. HTML, the transformed React
module, and the logo were also served successfully.

#### 4. Remove unused template content

After approval, deleted the unused React/Vite logos, hero image, demo favicon,
and icon sprite. Kept the original project images. Replaced the generic
frontend README with CallingIn instructions and added a root `.gitignore`.
Checked remaining source imports and references for missing files.

#### 5. Configure linting and formatting

Ran `npm uninstall oxlint`, then installed ESLint, its JavaScript rules,
environment globals, Prettier compatibility configuration, and React hooks
and refresh plugins. ESLint 9 was initially installed, but npm reported it
unsupported. The final setup uses ESLint 10. The incompatible
`eslint-plugin-react` was removed; the hooks and refresh plugins remain.

Installed Prettier with `npm install --save-dev --save-exact prettier`.
ESLint checks code mistakes and limits function complexity to 10. Prettier
makes formatting consistent. Formatting was applied to the application
files using `npm run format`, then checked with `npm run format:check`.

#### 6. Add and run HTTP tests

Added `backend/test/health.test.js` using Node’s built-in test runner.
Each test starts a temporary localhost server. Tests assert the health
endpoint’s status, JSON content type, and exact response, and check that
an unknown route returns 404. Ran `npm test` in `backend/`: both passed.

The sandbox initially blocked listening on localhost. Tests succeeded when
rerun with the required execution permission. This was an environment
restriction, not an endpoint assertion failure.

Ran `npm run lint` and `npm run format:check` in both applications, and
`npm run build` in the frontend. All passed. The build creates `dist/`;
it does not deploy the application.

#### 7. Add fast pre-commit checks

After separate approval, installed Husky and lint-staged at the root with
`npm install --save-dev husky lint-staged`, plus a pinned Prettier version.
Ran `npm run prepare` to activate the hook. The resulting local
`core.hooksPath` is `.husky/_`.

`.husky/pre-commit` runs `npm run precommit`. `.lintstagedrc.json` selects
staged application JavaScript for ESLint and supported staged text files
for Prettier checks. The tools do not auto-format files. Builds and tests
remain separate to keep commits fast. lint-staged uses its default backup
stash and temporarily hides unstaged portions of partially staged files.

Ran the hook with no staged files: it correctly skipped checks. Verified
that the lint commands work from the root, and intentional invalid stdin
input caused ESLint and Prettier to fail. A full staged-file hook run remains
unverified; the assistant did not stage files or create a test commit.

#### 8. Add safe environment configuration

Added `backend/.env.example` containing only `PORT=3001` and comments.
Updated backend scripts to use Node’s `--env-file-if-exists=.env` option.
No real `.env` file was created by the assistant. The frontend needs no
environment file for the current proxy configuration.

Verified the example loads `PORT=3001`, `.env` is ignored, and the example
can be tracked. Keep port 3001 unless the Vite proxy target is also updated.
The revised startup commands have not received a new full server smoke test.

#### 9. Document and organize

Updated the root README with install, run, environment, formatting, test,
build, and hook instructions, and fixed its September 15 meeting-note link.
Checked local links, npm script references, formatting, and whitespace.

Moved this log into `doc/sprint-01/` and created the
[Sprint 1 progress record](sprint-01-progress.md). Semester-wide planning
remains in `doc/`; advisor notes are collected in `doc/meetings/`.

### Important files and their roles

Paths below are relative to the repository root.

| File                                                    | Purpose                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `frontend/src/main.jsx`                                 | Mounts React into the HTML page.                            |
| `frontend/src/App.jsx`                                  | Welcome content and backend connection state.               |
| `frontend/src/App.css`, `frontend/src/index.css`        | Page layout, branding, and shared styles.                   |
| `frontend/index.html`                                   | HTML entry point, title, and description.                   |
| `frontend/vite.config.js`                               | React plugin, development port, and API proxy.              |
| `backend/src/app.js`                                    | Express application and health route.                       |
| `backend/src/server.js`                                 | Starts the backend and reports startup failures.            |
| `backend/test/health.test.js`                           | HTTP health and unknown-route tests.                        |
| `backend/.env.example`                                  | Safe optional backend configuration example.                |
| `frontend/eslint.config.js`, `backend/eslint.config.js` | Lint rules for each application.                            |
| `.prettierrc.json`, `.prettierignore`                   | Shared formatting choices and root exclusions.              |
| `.husky/pre-commit`, `.lintstagedrc.json`               | Hook command and staged-file checks.                        |
| `package.json`, `package-lock.json` in each package     | Commands, dependencies, and locked installation versions.   |
| `.gitignore`                                            | Excludes dependencies, generated output, and local secrets. |

### My Review and Changes

Decisions explicitly made in this conversation:

- The user runs branch creation, `git add`, `git commit`, and `git push`.
- Work proceeded in separately approved groups, including asset deletion.
- Application folders stay at the root; Git branches separate development history.
- Sprint-specific documentation belongs in `doc/sprint-01/`.
- The user renamed the log to `ai-development-log-1.md`.
- Trusted Circle remains future work; no authentication, database, AI requests,
  or private messaging was implemented.

Personal review of the rendered page and final code remains for the student
to record here. These notes do not claim that the advisor approved the work.

### Verification

Results below describe checks actually run during this session, not a fresh
rerun of every check after every documentation change.

| Check                                              | Observed result                                           |
| -------------------------------------------------- | --------------------------------------------------------- |
| Frontend and backend ESLint                        | Passed.                                                   |
| Frontend and backend Prettier checks               | Passed.                                                   |
| Backend HTTP tests                                 | 2 passed after granting local-port permission.            |
| Frontend production build                          | Passed.                                                   |
| Direct and proxied health requests                 | HTTP 200; expected JSON.                                  |
| Page/module/logo serving                           | Passed HTTP checks.                                       |
| Asset references and local documentation links     | Passed for files checked.                                 |
| Environment example loading and ignore rules       | Passed.                                                   |
| Hook activation and no-staged-files invocation     | Passed; no staged tasks executed.                         |
| ESLint/Prettier rejection of intentional bad input | Passed.                                                   |
| npm installation audits                            | Reported zero known vulnerabilities at installation time. |
| `git diff --check`                                 | Passed after edits checked.                               |
| Browser visual and interactive checks              | Not completed: browser automation unavailable.            |
| Hook with actual staged changes                    | Pending user staging and verification.                    |
| Full startup after optional env-file script change | Not rerun.                                                |
| Deployment                                         | Not performed.                                            |

No staging, commits, pushes, or merges were performed by the assistant.
User Git activity outside the conversation is not inferred from these notes.

### Useful official learning links

- [React Quick Start](https://react.dev/learn): components, JSX, state, and events.
- [Vite guide](https://vite.dev/guide/): scaffolding and development commands.
- [Vite proxy options](https://vite.dev/config/server-options#server-proxy): forwarding API requests.
- [Express routing](https://expressjs.com/en/starter/basic-routing/): defining HTTP endpoints.
- [ESLint configuration](https://eslint.org/docs/latest/use/configure/): configuring code checks.
- [Prettier installation](https://prettier.io/docs/install): installing and running formatting checks.
- [Node test runner](https://nodejs.org/api/test.html): the built-in test tools.
- [Husky setup](https://typicode.github.io/husky/get-started.html): local Git hook activation.
- [lint-staged documentation](https://github.com/lint-staged/lint-staged): staged-file tasks and stash behavior.

For current installation and run commands, use the
[daily commands](../daily-commands.md). See also the [frontend instructions](../../frontend/README.md).
