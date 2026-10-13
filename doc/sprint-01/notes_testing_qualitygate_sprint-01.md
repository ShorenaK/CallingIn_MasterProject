# CallingIn — Sprint 01 Testing and Quality Gates

**Course:** CS 8674 — Project Course, Fall 2026  
**Project:** CallingIn — AI Communication Coach MVP  
**Sprint:** Sprint 01 — Planning and project foundation  
**Documentation date:** October 12, 2026  
**Status:** Root-level quality commands configured and exercised; staged-file checks verified manually; automatic Git hook invocation observed during a commit.

## Quality tools — configuration reviewed October 13, 2026

| Purpose             | Tool and current status                                              | Configuration or command                                                                        |
| ------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Linter              | ESLint, configured for both applications                             | `frontend/eslint.config.js`, `backend/eslint.config.js`; `npm run lint`                         |
| Formatter           | Prettier, configured                                                 | `.prettierrc.json`; `npm run format:check`                                                      |
| Complexity analysis | ESLint complexity rule; maximum 10 per function                      | Both ESLint configurations use `complexity: ['error', 10]`                                      |
| Type checker        | TypeScript `tsc` is not configured; application code uses JavaScript | No type-check script or TypeScript configuration; `@types/react` alone does not enable checking |
| Build tool          | Vite frontend production build                                       | `frontend/vite.config.js`; `npm run build`                                                      |
| Dependency scanner  | npm audit, available through npm but outside the combined check      | Run audits for root, frontend, and backend separately                                           |
| Alternative scanner | Snyk is not configured as a project dependency                       | No Snyk project script                                                                          |
| Commit checks       | Husky and lint-staged                                                | `.husky/pre-commit`, `.lintstagedrc.json`; `npm run precommit`                                  |

See the [daily guide](../daily-commands.md) for audit timing, commands, and
Prettier/ESLint failure fixes. No type checker or Snyk installation was added.

## Purpose and background

During Sprint 01, the project was organized into a React frontend and a Node.js/Express backend. Quality tools were already configured in the individual applications. To make checks easier to run consistently, a **root `package.json`** was added or updated with commands that coordinate both applications. The goal was to verify actual behavior rather than assume that the presence of configuration files meant everything worked.

**Simple analogy:** The frontend and backend are two rooms in a house. Each room has its own safety checklist; the root `package.json` is the clipboard at the front door that coordinates checks for the whole house.

## Project structure and root-level configuration

Illustrative structure (not a complete directory listing):

```text
CallingIn/                         ← project root; run commands here
├── package.json                   ← root commands
├── .husky/
│   └── pre-commit                 ← runs npm run precommit
├── .lintstagedrc.json             ← staged-file check rules
├── frontend/
│   └── package.json               ← frontend commands
├── backend/
│   └── package.json               ← backend commands
└── doc/
    └── sprint-01/
        └── notes_testing_qualitygate_sprint-01.md
```

The root `package.json` is **not a replacement** for either application's `package.json`. It coordinates their existing scripts. The root command observed was:

```text
npm run check
  → npm run lint
  → npm run format:check
  → npm test
  → npm run build
```

### Commands confirmed by terminal output

Run from the **CallingIn root folder**:

```bash
npm run check                 # combined project check
npm run lint                  # frontend lint, then backend lint
npm run format:check          # Prettier check
npm test                      # backend Node test runner
npm run build                 # frontend production build
npm run precommit             # manually run lint-staged on staged files
```

The root scripts observed call application-specific commands such as:

```bash
npm --prefix frontend run lint
npm --prefix backend run lint
npm --prefix backend test
npm --prefix frontend run build
```

**Note:** The transcript does not show the complete current `package.json`, so this document records commands confirmed in the terminal, not a claim about every available script.

---

## 1. What is a quality gate?

**What:** A set of checks that code must pass before advancing to the next stage.

**Why:** Helps catch problems early and reduces the chance of merging broken work.

**Analogy:** Airport security: passing the checkpoint is required before boarding, but it does not guarantee the entire trip will be problem-free.

**CallingIn:** Fast checks for staged files before commits; broader checks before merging a sprint branch into `main`.

## 2. Linting — ESLint

**What:** A tool that flags certain JavaScript errors and rule violations.

**Why:** Catches problems such as unused variables or suspicious code patterns.

**Analogy:** A spellchecker for code: useful, but it cannot prove the program does the right thing.

**Verified:** Both frontend and backend ESLint passed with `--max-warnings 0` during `npm run check`.

```text
frontend: eslint . --max-warnings 0   → passed
backend:  eslint . --max-warnings 0   → passed
```

## 3. Complexity checks

**What:** Linting rules that warn about difficult-to-follow code, such as functions with too many branches.

**Why:** Simpler functions are easier to understand, test, and maintain.

**Analogy:** A route with three turns is easier to follow than a route with twenty confusing intersections.

**Configuration reviewed October 13, 2026:** Both ESLint configurations contain `complexity: ['error', 10]`, limiting function complexity to 10. `npm run lint` checks both applications and passed after the dependency update. The September 29 meeting record also documents rejection of a sample with complexity 11. This does not establish other rules such as `max-depth` or `max-lines-per-function`.

## 4. Formatting — Prettier

**What:** A tool that checks or applies consistent spacing, indentation, and other formatting.

**Why:** Makes code easier to read and Git diffs easier to review.

**Analogy:** A school report template that keeps headings, margins, and spacing consistent.

**Verified:** `npm run format:check` ran `prettier --check .` and reported:

```text
Checking formatting...
All matched files use Prettier code style!
```

Prettier checks presentation; ESLint checks coding rules. Neither proves that application behavior is correct.

## 5. Project-wide checks and root scripts

**What:** One root-level command coordinates checks in the frontend and backend.

**Why:** Avoids forgetting to check one part of the application.

**Analogy:** A building inspection that checks both floors rather than only the lobby.

**Verified:** `npm run check` successfully ran through linting, formatting, and backend tests in the shared output. The original pasted `npm run check` output ended when Vite started; a **separate** `npm run build` later confirmed the frontend build succeeded. Therefore, each component is confirmed to work, but the shared excerpt alone does not prove that particular combined run completed.

## 6. Pre-commit hooks — Husky

**What:** A Git hook runs commands automatically before Git creates a commit.

**Why:** Helps stop preventable mistakes from entering commit history.

**Analogy:** Checking an email for errors immediately before pressing Send.

**Observed configuration:**

```bash
ls -la .husky
cat .husky/pre-commit
git config --get core.hooksPath
```

Results:

```text
.husky/pre-commit exists
pre-commit content: npm run precommit
core.hooksPath: .husky/_
```

The file exists and Git is configured to use Husky's hooks path.

**Automatic execution evidence:** The later VS Code screenshot shows a real `git commit -m "chore: configure root quality checks"` with staged-file task output and a successful commit. This supports that the hook ran during that commit. A deliberately failing commit was **not** tested, so its blocking behavior has not been directly demonstrated.

## 7. Automated tests

**What:** Programs that verify expected application behavior.

**Why:** Help catch regressions when code changes.

**Analogy:** Testing a door with the correct key and the wrong key, not merely checking whether the door looks fine.

**Verified:** The backend uses Node's built-in test runner (`node --test`). Two tests passed:

1. `GET /api/health` returns HTTP 200 and the expected JSON health contract.
2. An unknown API route returns HTTP 404 rather than a healthy response.

```text
tests 2
pass 2
fail 0
```

These are backend route tests, **not** tests of the AI Communication Coach.

## 8. Failure-path testing

**What:** Testing what happens when something goes wrong.

**Why:** Real users encounter invalid input, network failures, timeouts, and unavailable services.

**Analogy:** A fire drill checks how a building responds when normal conditions fail.

**CallingIn:** As the AI Coach is built, test empty input, failed AI requests, timeouts, malformed responses, and retry behavior if retries are implemented.

**Current evidence:** The unknown-route HTTP 404 test is one verified negative-path test. AI-specific failure tests have **not** been shown as implemented.

## 9. Automated enforcement

**What:** Tools run checks as part of the workflow rather than relying only on memory.

**Why:** Makes quality checks more consistent.

**Analogy:** A car's seat-belt reminder prompts a safety step automatically.

**Verified:** Husky's pre-commit integration and `lint-staged` are configured; an actual commit showed the staged-file task workflow running.

**Not verified:** CI or GitHub branch protection that requires the full quality gate before merging. Local hooks alone are not the same as server-side enforcement.

## 10. Quality gates before committing and merging

### Fast gate — before a commit

Configured flow:

```text
git add <files>
    ↓
git commit -m "message"
    ↓
Husky runs npm run precommit
    ↓
lint-staged checks matching staged files
    ↓
Commit proceeds if checks succeed
```

**Analogy:** Checking keys, wallet, and phone before leaving home.

**Important:** `npm run precommit` is an optional **manual** way to run the same staged-file checks. It does **not** replace `git commit`. In normal use, the Git hook invokes it automatically.

### Full gate — before merging into `main`

Recommended manual command:

```bash
npm run check
```

This coordinates full linting, formatting, backend tests, and the frontend production build.

**Analogy:** A full vehicle inspection before a long trip.

**Important:** This is a recommended pre-merge practice; the transcript does not show that GitHub enforces it automatically.

## 11. Frontend production build — Vite

**What:** Bundles the React application into production-ready files.

**Why:** Finds some build-time issues that may not appear while editing.

**Analogy:** A dress rehearsal before a performance.

**Verified separately with:**

```bash
npm run build
```

Observed result:

```text
vite v8.3.1 building client environment for production...
✓ 18 modules transformed.
✓ built in 180ms
```

The build produced assets under `frontend/dist/`. This confirms a successful build, **not** that every page or user flow works correctly.

## 12. Node's test runner versus Vitest

**Node's test runner:** Built into Node.js and already used for CallingIn backend tests.

**Vitest:** A separate testing framework often used for frontend and React projects.

**Why:** Choose tools according to testing needs; do not replace working tools without a reason.

**Analogy:** Two calculators can both perform arithmetic; there is no need to replace one that works.

**Decision so far:** Keep Node's runner for existing backend tests. No evidence in this record that Vitest is required.

## 13. Custom AI skills versus executable checks

**Custom skill:** Instructions guiding an AI assistant through a review.

**Executable check:** A command that actually runs against files or application behavior and reports a result.

**Why:** AI can help review, but should not substitute for repeatable checks.

**Analogy:** A tutor explains how to prepare; an exam checks what you can actually do.

**Current approach:** Prioritize working lint, format, test, build, and Git hook commands. A custom review skill can come later.

## 14. Record actual results

**What:** Save the commands run and their observed outcomes.

**Why:** Configuration is a plan; successful execution is evidence.

**Analogy:** Owning a smoke detector is different from pressing its test button.

### Sprint 01 verification record

| Item                          | Command or evidence                                    | Observed outcome                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Root combined command         | `npm run check`                                        | Lint, formatting, and tests passed in captured output; combined run's build completion not shown in that excerpt |
| Frontend lint                 | Root `npm run lint` → frontend ESLint                  | Passed, zero warnings required                                                                                   |
| Backend lint                  | Root `npm run lint` → backend ESLint                   | Passed, zero warnings required                                                                                   |
| Formatting                    | `npm run format:check`                                 | Passed; all matched files formatted                                                                              |
| Backend tests                 | `npm test` → `node --test`                             | 2 passed, 0 failed                                                                                               |
| Frontend build                | Separate `npm run build`                               | Passed; Vite 8.3.1, 18 modules, 180 ms                                                                           |
| Hook file                     | `cat .husky/pre-commit`                                | `npm run precommit`                                                                                              |
| Git hook path                 | `git config --get core.hooksPath`                      | `.husky/_`                                                                                                       |
| Precommit script              | `npm pkg get scripts.precommit`                        | `"lint-staged"`                                                                                                  |
| Inline lint-staged config     | `npm pkg get lint-staged`                              | `{}`; configuration is in a separate file                                                                        |
| Configuration file            | `cat .lintstagedrc.json`                               | Frontend ESLint, backend ESLint, and Prettier patterns present                                                   |
| Staged-file check             | `git add package.json` then `npm run precommit`        | Passed; Prettier checked one staged JSON file                                                                    |
| Branch/status before commit   | `git status`                                           | `sprint-01-planning`; `package.json` staged                                                                      |
| Automatic hook on commit      | VS Code terminal screenshot                            | Staged-file task output appeared during successful commit                                                        |
| Commit                        | `git commit -m "chore: configure root quality checks"` | Successful local commit `df81315`, 1 file changed, 6 insertions, 1 deletion                                      |
| Complexity-rule enforcement   | Inspect ESLint config                                  | Not yet verified individually                                                                                    |
| Full GitHub merge enforcement | CI / branch protection                                 | Not verified                                                                                                     |
| Hook failure blocks commit    | Intentional failing test on safe branch                | Not tested                                                                                                       |

### `lint-staged` configuration inspected

```json
{
  "frontend/**/*.{js,jsx}": "node frontend/node_modules/eslint/bin/eslint.js --max-warnings 0",
  "backend/**/*.js": "node backend/node_modules/eslint/bin/eslint.js --max-warnings 0",
  "*.{js,jsx,json,css,html,md,yml,yaml}": "prettier --check"
}
```

The `*` formatting pattern in `lint-staged` is used to select matching staged files; it is not a statement that every file in the repository is checked at commit time. The manual run with only `package.json` staged demonstrated the Prettier rule. The frontend/backend ESLint rules were exercised during the **full lint** command, but not individually through a staged-file hook run in the shared evidence.

### Git workflow used

```bash
git status
git add package.json
npm run precommit             # manual verification only
git status
git diff --cached             # recommended review of staged changes
git commit -m "chore: configure root quality checks"
```

`git add` stages files, `git commit` records a local snapshot, and `git push` sends commits to the remote repository. **No push result is included in the shared evidence.** Prefer `git add <specific files>` when you want to control exactly what goes into a commit; `git add .` stages all changes in the current directory tree.

## 15. Practical next steps for CallingIn

1. **Keep using the root checks:** Run `npm run check` before merging sprint work into `main`.
2. **Use the normal commit workflow:** Stage reviewed files, then commit. Husky should invoke `npm run precommit` automatically; manually running it every time is unnecessary.
3. **Verify the hook's failure behavior when convenient:** Use a safe temporary branch and a controlled failing staged file; do not disrupt current work.
4. **Maintain complexity rules:** Both applications configure a limit of 10; review changes to those configurations as development continues.
5. **Add tests alongside AI Coach development:** Include success and failure paths; do not claim coverage for features not yet implemented.
6. **Consider frontend test coverage and CI later:** These are next improvements, not verified Sprint 01 accomplishments.
7. **Keep a dated verification record:** Save the command, result, branch, and any fix needed after failures.

## Summary for the professor

During Sprint 01, I configured or updated the root-level npm quality-check workflow for CallingIn, which has separate frontend and backend applications. I ran the combined checks and observed successful linting, formatting, and two backend tests. I also ran the frontend production build separately and confirmed that it succeeded. I inspected the Husky pre-commit hook and `lint-staged` rules, manually ran the staged-file checks on `package.json`, and observed staged-file checks during a successful commit on `sprint-01-planning`. These checks provide a repeatable quality foundation, with a configured complexity limit of 10 in both applications. A deliberately failing hook test, frontend feature tests, and server-side pre-merge enforcement remain to be verified or added.

**Bottom line:** Quality gates do not prove software is perfect. They make checks repeatable, catch certain mistakes early, and provide evidence of what was actually tested.
