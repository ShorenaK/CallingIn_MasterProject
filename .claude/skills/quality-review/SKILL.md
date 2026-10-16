---
name: quality-review
description: Read-only quality review of CallingIn before a PR or at sprint end. Runs project-wide checks, then reviews changed code for duplication, documentation accuracy, and test meaningfulness (success and failure paths). Reports measured results and proposed fixes; never edits.
disable-model-invocation: true
argument-hint: '[full]'
---

# CallingIn quality review

Read-only. Do not edit, install, stage, commit, push, merge, or configure
anything. Never open .env files or print credentials. Claude may suggest this
skill but must not run it unless the user invoked /quality-review.

## 1. Scope

- Default: files changed vs main. Use `git diff main...HEAD --name-only` plus
  `git status --short` for uncommitted work.
- With the argument `full`: all of backend/src, backend/test, frontend/src.
- Project-wide checks (step 2) always run on everything. If shared config
  changed (eslint.config.mjs, tsconfig*, package.json, workflow, hooks), say so
  and note that unchanged code may be affected.

## 2. Run and record

Run each command and record the real outcome (pass, fail with errors, or
not completed):

1. `npm run lint`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run test:coverage`
5. Build WITHOUT touching tracked files:
   `npm --prefix frontend run build -- --outDir <scratchpad>/build --emptyOutDir`
6. `npm audit`, `npm --prefix frontend audit`, `npm --prefix backend audit`

Rules:

- Network or registry failures for audits are "NOT COMPLETED", never "passed".
- If any command cannot run, report that. Never infer a result.
- Afterwards run `git status --short`; report any file the checks created or
  changed.

## 3. Review

Read the in-scope code and apply rubric.md: duplication, documentation, test
meaningfulness, guardrail gaps. Cite file:line for every finding.

## 4. Report

Use report-template.md. Keep MEASURED (command output) separate from JUDGED
(your reading). Print the manual checklist with every item "NOT CHECKED"
unless you actually verified it this run and say how.
Chat only. Offer to save Markdown to doc/sprint-NN/quality-review-YYYY-MM-DD.md
and wait for approval before writing.
End with numbered proposed fixes. Explain each, then wait for the user to pick.
