# Sprint 5 — AI Coach progress

**Created:** November 3, 2026 (America/New_York)

**Branch:** `sprint-05-ai-coach`

**Starting point:** main at `0017bbf`, the approved Sprint 4 merge.

**Status:** Backend-only Coach foundation implemented locally November 4. Real
OpenAI integration, frontend controls, and deployment are not implemented.

## Current summary — November 4

Superseded in part by the backend implementation entry below; earlier planning
statements describe their own checkpoint.

- Sprint 4 implementation, review fixes, and merge are complete. Recorded final
  checks: 267 simulated backend and 92 mocked Chromium tests, plus static checks
  and scratch build; earlier live report: 101 assertions.
- AI Coach design and provider comparison are documented. Shorena selected
  OpenAI as the provider direction; model/configuration and implementation still
  need approval. No AI implementation or paid calls have occurred.
- Focused carry-over: human keyboard-only testing in Sprint 5, separately designed
  30-day invitation retry, and deployment/login-policy/dependency-override review.
  See the [plan](sprint-5.md) and [central deferred list](../deferred-tasks.md).
- The meeting agenda now includes deployment requirements, Spring 2027 enrollment
  and daytime meetings, a project-based business-agent proposal, and both HBS links.
- Latest submitted Sprint 5 checkpoint is `d996d33`, matching the local origin
  tracking reference when this cleanup began. Current documentation edits remain
  uncommitted; no fetch, test suite, or hosted check was run for this cleanup.

The dated entries below preserve their original checkpoints. Their earlier
“uncommitted,” “no provider selected,” and “questions not yet supplied” statements
are historical and superseded by this summary. Shorena requested removal of
repeated old checklists from active planning. Older report limitations remain
recorded, not silently converted into passing results. This documentation request
authorizes neither runtime changes nor Git submission.

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

## November 4 — Approved first backend implementation

Shorena reported having ChatGPT Pro, chose OpenAI as the provider direction, and
approved the explained backend-only foundation with local test doubles. Credit
eligibility/balance has not been verified or activated. This approval excludes
real API calls, packages, UI integration, database migrations, and deployment.

Implemented `POST /api/ai-coach/suggestions`, protected by the existing exact
origin/JSON, session, and freshly verified account guards. Input accepts only
`action` (`draft`/`refine`), `tone` (`natural`/`warm`/`direct`), and visible text
within 5,000 trimmed UTF-16 units; the separate 16 KB JSON limit still applies.
Provider output must be plain visible text within that same text limit.

The optional app-factory provider function receives only validated writing input
and an AbortSignal. Normal startup supplies no provider and returns 503 rather
than a pretend suggestion. Controlled test doubles exercise the success path.
No private account data, history, database access, or credential is passed to the
provider boundary. The endpoint never stores or sends an invitation.

Development guards allow five attempts/account/minute, including invalid and
failed handler attempts, and one active generation per account per app instance.
The default deadline is 20 seconds. Timeout/disconnection aborts the signal,
clears timers/listeners, releases the account slot, and ignores late results.
Provider cooperation is still required to stop its underlying work. These
process-local controls reset on restart and are not a durable daily cost budget.
Daily quotas and real-provider byte/token limits remain for the live integration.

Malformed provider output returns 502; controlled refusal 422; timeout 504;
missing/unavailable provider or arbitrary failure 503. Public errors are fixed
application text. Unexpected errors log an allowlisted generic operation without
inspecting provider errors or logging prompt/output. Responses are no-store.

Changed source: `backend/src/app.js`, `safe-logging.js`, new `ai-coach.js`,
`ai-coach-policy.js`, and `ai-coach-provider.js`. Added
`backend/test/ai-coach.test.js`. No frontend or database schema changed.

Verification actually performed:

- Whole-project lint and frontend/backend type checks passed.
- Initial 13 targeted tests passed after allowing local loopback ports. The
  first sandboxed attempt failed with listen EPERM, not application assertions.
- Full backend coverage suite after cancellation/late-result tests: **282 passed,
  zero failures/skips**, including **15 Coach tests**. Simulated storage and
  controlled provider doubles; **100% lines/functions, 98.47% branches** overall.
- Changed-file formatting and whitespace checks passed. No browser suite or
  frontend build rerun for this backend-only step; no frontend behavior changed.

No OpenAI request, private `.env` read, installation, network audit, database
connection, credit activation, deployment, Git submission, or Claude review was
performed. Existing uncommitted deferred/Sprint 4 checklist edits were preserved.
Implementation and documentation remain local for review. Next: review this
foundation, then separately approve frontend work or the real OpenAI adapter and
its budget/privacy/configuration details. No full transcript archive was created.
