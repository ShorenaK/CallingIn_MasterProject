# Sprint 5 — AI Coach progress

**Created:** November 3, 2026 (America/New_York)

**Branch:** `sprint-05-ai-coach`

**Starting point:** main at `0017bbf`, the approved Sprint 4 merge.

**Status:** Planning/setup only. AI Coach implementation has not started.

## November 3 — Branch, documentation, and meeting preparation

Shorena asked to create Sprint 5 with its Markdown records, schedule the meeting
for next Tuesday, and transfer all Meeting 4 questions to Meeting 5. On November 3,
next Tuesday is **November 10, 2026**.

The Desktop checkout was clean on retained Sprint 4 at `61184fc`. Main was
`0017bbf`, matching the local origin/main ref from the just-completed push. The
requested branch was created from main and the Desktop checkout switched to it.
No old sprint branch was deleted and no worktree was created or removed.

Documents prepared:

- [Folder index](README.md).
- [Sprint plan and checklist](sprint-5.md), including the explicit unfinished
  live/manual verification inherited from the merged work.
- This progress record.
- [Command guide](commands_sprint-05.md), based on the current package scripts.
- [Meeting 5 — November 10](../meetings/meeting-5_2026-11-10.md), with an updated
  agenda and all five Meeting 4 question sections preserved verbatim.
- The earlier November 3 Meeting 5 draft is retained with a rescheduling note;
  historical references are not broken and no advisor responses are invented.

## Verified starting behavior and evidence

The merged application includes accounts, invitations, private conversations,
message history/replies, and owner-saved Social Battery with private partner
visibility. AI suggestions/refinement are not implemented yet. The planned
technology remains the actual React/Vite, Express, native MongoDB driver, and
JavaScript/checkJs stack; no provider, SDK, model, or AI schema was selected.

Immediately before the merge, the final runtime source passed **267 backend
tests** (simulated storage; 100% lines/functions, 98.35% branches), **92 Chromium
tests** (mocked APIs with axe), lint, type checks, and scratch build. Claude's
reviews covered `589032c` and follow-up fixes at `a4bc652`; small polish followed
in `61184fc`. These are historical checkpoints, not suites rerun for setup.
The earlier independent live record reports 101 assertions and identifies its
limits. Human checks, restart/database/backup evidence, and selected boundaries
remain open in the new checklist.

Parent Quality runs passed before merging. Main merge `0017bbf` was pushed; its
new Quality run was in progress when last checked. No hosted success is inferred
from the merge or branch creation.

## Verification performed for this setup

- Inspected current Git/branches/worktrees, sprint plan, existing command scripts,
  previous progress records, and meeting questions.
- Checked Markdown formatting, local links, the Tuesday date, preservation of
  all five original question sections, and the documentation-only edit scope.
- No application tests, package installations, private environment reads, live
  API/database checks, AI-provider calls, or audits were performed for setup.

## Next approved-step workflow

Read the plan/checklist, inspect current source, then explain the first AI Coach
backend design using WHAT, WHY, HOW, WHERE, IMPACT, and RECOMMENDATION. Obtain
Shorena's approval before implementation. Keep explanations practical and work
one step at a time. Additional meeting questions can be added when supplied.

This branch is local and has not been pushed. These documents are uncommitted;
setup is not a Git submission or final implementation approval. The curated
memory still describes its earlier snapshot: inspect this record and current Git
when restoring. No new Save Session or full transcript archive was requested here.

## November 4 — Design proposal and low-cost testing discussion

This dated entry supersedes the earlier setup's local/unpushed status. At the
start of this documentation update, Desktop was clean on `sprint-05-ai-coach` at
`4aebeab`, matching its local origin tracking reference. No new fetch was run.
Setup was submitted as `8c37a03`; the separately approved design-only Git flow
committed and pushed `4aebeab` with the normal formatting hook passing.

Shorena approved creating the [AI Coach design proposal](ai-coach-design.md),
then asked questions about provider-specific behavior, controlled test doubles,
using her personal ChatGPT subscription, when to claim credits, Render hosting,
and Amazon alternatives. Her stated priority is minimal spending for class and
testing. She then explicitly requested recording this discussion in Markdown.

The design now explains:

- Prepared provider responses let backend tests rehearse success, delays, and
  failures without paid AI calls; they do not evaluate real model quality.
- The proposed sequence from design approval through local mocked tests,
  credit checks, approved live calls, deployment, review, and closeout.
- Her exact personal ChatGPT plan remains unknown. Check eligibility now and
  claim eligible API credits near the first real test, considering expiry.
  No subscription upgrade, credit purchase, or activation is recommended now.
- OpenAI and Amazon Bedrock are candidates, not selections. Current official
  credit/pricing documentation was consulted during the questions; account
  eligibility and actual balances were not inspected.
- One free Render service serving React and Express is a demo proposal, with
  deployment preparation covering routing, Node/build/start, HTTPS origin,
  proxy/secure cookies, secrets, Atlas access, budgets, and deployed verification.
  Free hosting and AI usage are separate; cold starts and usage limits apply.

Only Markdown records were updated for this request: the design, this progress
file, and a dated handoff pointer in Sprint 4 progress on the active Sprint 5
branch. No completed sprint branch was checked out or altered. No application
code, package, schema, account setting, deployment, or private `.env` was changed.
No provider calls, installations, application test suites, credit applications,
or hosted Quality checks were performed. Documentation formatting, local links,
and whitespace were checked; this is not runtime verification.

Provider/model/SDK, dollar budget, final UI/API design, quota persistence, and
deployment remain undecided and require their explained approvals. Shorena plans
to supply professor questions next; none were invented. These follow-up edits
remain local/uncommitted until a separately authorized Git submission. No curated
memory save or full transcript archive was requested.
