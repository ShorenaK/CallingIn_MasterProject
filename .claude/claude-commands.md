# Claude commands for CallingIn

## /quality-review

Read-only quality review. Runs the project checks, then reviews code for
duplication, documentation gaps, and test meaningfulness. It never edits files.

### How to run

1. Open Claude Code in the `CallingIn` folder. If the command is not listed,
   start a new session or reload the VS Code window.
2. Type one of:
   - `/quality-review` reviews files changed vs `main`.
   - `/quality-review full` reviews all backend and frontend code and tests.
3. Approve each command prompt (lint, format, typecheck, tests with coverage,
   build, and the three `npm audit` runs). The audits need internet; a failure
   is reported as NOT COMPLETED, not passed.
4. Read the report in chat, then tell Claude which proposed fixes to apply.
   Nothing changes until you choose.
5. Optional: ask Claude to save the report as
   `doc/sprint-NN/quality-review-YYYY-MM-DD.md`. It asks first.

### When to run

- Before each pull request, normally use `/quality-review` to review changes
  against `main`.
- At sprint completion, use `/quality-review full`. One full run can cover
  both sprint completion and its pull request.
- Run a review after substantial changes to authentication, dependencies, or
  shared configuration. Use `full` when the changes affect the wider project.
- No need to run the skill after every small edit. For routine checks, run
  `npm run check` from the CallingIn root.

The skill runs only when I invoke it; it is not scheduled or automatic.

### Notes

- The build step writes to a temporary folder so the tracked `frontend/dist`
  is not changed. The report lists any files the checks changed.
- The manual checklist stays NOT CHECKED unless verified during the run.
- Coverage percentages measure executed code, not correctness.
- Skill files: `.claude/skills/quality-review/` (`SKILL.md`, `rubric.md`,
  `report-template.md`).
