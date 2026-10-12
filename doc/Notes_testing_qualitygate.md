# Notes: Testing and Quality Gates

**Project:** CallingIn — Fall 2026

## 1. What is a quality gate?

**What it is:** A quality gate is a set of checks that must pass before code moves to the next stage, such as being committed or merged into the main branch.

**Why we need it:** It helps catch mistakes early and keeps the project stable as features are added.

**Analogy:** Think of a quality gate as an airport security checkpoint. Before passengers proceed, they must pass required checks. Likewise, code should pass agreed checks before it moves forward.

**For CallingIn:** Use quick checks before commits and more complete checks before merging a sprint branch.

## 2. Linting (ESLint)

**What it is:** Linting automatically examines source code for likely mistakes and violations of coding rules. ESLint is a common linter for JavaScript.

**Why we need it:** It can catch problems such as unused variables, suspicious code patterns, and inconsistent practices before they become bugs.

**Analogy:** A spellchecker for code. It does not guarantee that the meaning is correct, but it flags issues worth fixing.

**Current status:** ESLint is configured for both the frontend and backend. The commands still need to be run to verify that the intended files are actually checked.

## 3. Complexity checks

**What they are:** Rules that flag functions or code paths that are unusually difficult to follow, such as functions with too many branches.

**Why we need them:** Simpler code is generally easier to understand, debug, test, and maintain.

**Analogy:** Directions with two turns are easier to follow than directions with twenty complicated intersections. Complexity checks point out code that may need a simpler route.

**Important:** A complexity warning is a prompt to review code, not proof that the code is wrong.

## 4. Formatting (Prettier)

**What it is:** Prettier automatically applies consistent formatting, such as indentation, spacing, and line wrapping.

**Why we need it:** It makes code easier to read and reduces unnecessary formatting differences in Git changes.

**Analogy:** A document template that makes every chapter use consistent fonts, margins, and spacing.

**Difference from ESLint:** Prettier focuses on appearance; ESLint focuses mainly on code rules and possible mistakes.

## 5. Project-wide checks

**What they are:** Commands that run required checks across the entire project, including the React frontend and Node/Express backend.

**Why we need them:** Checking only one application could leave problems in the other application unnoticed.

**Analogy:** A building inspection that checks every floor rather than just the lobby.

**Current status:** Separate commands exist. A useful next step is one root-level command that runs checks for both applications.

## 6. Pre-commit hooks

**What they are:** Scripts Git runs automatically before creating a commit. A hook may check staged files—the files included in that commit.

**Why we need them:** They catch quick, preventable problems before those changes are recorded in Git history.

**Analogy:** Reviewing an email's spelling and attachments just before pressing Send.

**Current status:** A hook exists and checks staged files. Verify that it correctly uses the frontend and backend ESLint configurations.

**Limitation:** Local hooks may be skipped or may not run on every contributor's computer. They are helpful, but should not be the only enforcement mechanism.

## 7. Automated tests

**What they are:** Programs that check whether application behavior matches expected results.

**Why we need them:** They help detect regressions when code changes.

**Analogy:** Testing a door by checking that the correct key opens it, the wrong key does not, and the lock still works after repairs.

**For CallingIn:** The backend already has a health test. As the AI Communication Coach is developed, plan tests for successful requests and failure paths—for example, missing input, unavailable AI service, invalid responses, and safe handling of errors.

**Important:** A passing health test only confirms the behavior it tests; it does not prove the entire application works.

## 8. Failure-path testing

**What it is:** Testing what happens when something goes wrong, not only when everything works normally.

**Why we need it:** Real users may submit empty text, lose their connection, or encounter an AI provider error. The application should respond clearly and safely.

**Analogy:** A fire drill tests what happens during an emergency, not just on an ordinary day.

**For CallingIn:** Check that the coach handles blank input, server errors, timeouts, and unsuccessful AI requests without exposing sensitive details.

## 9. Automated enforcement

**What it is:** Making required checks run as part of the development workflow rather than relying only on someone remembering to run them.

**Why we need it:** Consistent checks reduce accidental omissions.

**Analogy:** A car's seat-belt warning reminds you of a safety step even when you are distracted.

**Current status:** A pre-commit hook exists, but broader enforcement has not been verified. A future option is CI (continuous integration), which runs checks automatically when code is pushed or a pull request is opened.

## 10. Quality gates before committing and merging

### Before a commit: fast gate

- Lint the relevant changed files.
- Check or apply consistent formatting.
- Fix errors before committing.

**Why:** These checks should be fast enough to run frequently.

**Analogy:** A quick checklist before leaving home: keys, phone, wallet.

### Before merging a sprint branch: full gate

- Run frontend and backend linting.
- Run relevant automated tests, including failure paths.
- Run the frontend production build.
- Review the results and resolve failures.

**Why:** Merging affects the shared main branch, so it deserves more thorough verification.

**Analogy:** A complete vehicle inspection before a long road trip.

**Note:** These are proposed project rules, not proof that they are already enforced.

## 11. Frontend production build

**What it is:** The process that bundles and prepares the React application for deployment.

**Why we need it:** Development mode may work even when a production build fails. Running the build catches certain integration and configuration problems.

**Analogy:** A dress rehearsal before a performance: practice is useful, but the complete show must work together.

## 12. Node's test runner vs. Vitest

**Node's built-in test runner:** Testing functionality included with Node.js. The CallingIn backend currently uses it.

**Vitest:** A separate JavaScript testing framework often used in modern frontend projects, including React applications.

**Why the distinction matters:** Both can run automated tests. A tool should be chosen because it fits the project's needs, not simply because it is popular.

**Analogy:** Two different calculators can both do arithmetic. You do not need to replace one that already does the job.

**Current decision:** There is no established requirement to replace Node's test runner with Vitest. “Vita test” may have meant Vitest, but this has not been confirmed.

## 13. Custom AI skills vs. executable checks

**Custom AI skill:** A reusable set of instructions that guides an AI assistant through a review or workflow.

**Executable check:** A command or test that runs against the actual code and returns a result.

**Why both can help:** An AI skill can remind you what to review, but executable tools provide repeatable, observable checks.

**Analogy:** A coach can explain how to prepare for an exam, but the exam itself measures whether the required answers are correct.

**Recommendation:** Use AI review as support, not as a replacement for linting, tests, and builds.

## 14. Record actual results

**What it means:** Document which commands ran, whether they passed or failed, and what was fixed.

**Why we need it:** A configuration file shows that a check is planned; a successful run provides evidence that the check works.

**Analogy:** Owning a smoke detector is different from testing that its alarm actually sounds.

**Simple record example:**

| Check | Result | Notes |
| --- | --- | --- |
| Frontend lint | Not yet verified | Run and record outcome |
| Backend lint | Not yet verified | Run and record outcome |
| Pre-commit hook | Not yet verified | Confirm correct ESLint config |
| Backend health test | Not yet verified | Run existing test |
| Frontend build | Not yet verified | Run before merge |

Do not mark a check as passing until it has actually been run successfully.

## 15. Practical next steps for CallingIn

1. Run the existing frontend and backend lint commands.
2. Verify the pre-commit hook checks staged files using the correct configurations.
3. Run the existing backend health test.
4. Add a root command for project-wide checks.
5. Agree on a fast pre-commit gate and a fuller pre-merge gate.
6. Add tests as new AI Communication Coach behavior is implemented.
7. Record command results instead of assuming configured tools are working.

**Bottom line:** Quality gates do not make software perfect. They create a repeatable way to catch problems early and provide evidence that important checks were completed.
