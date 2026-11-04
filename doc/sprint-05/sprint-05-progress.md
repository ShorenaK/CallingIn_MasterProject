# Sprint 5 — AI Coach progress

**Created:** November 3, 2026 (America/New_York)

**Branch:** `sprint-05-ai-coach`

**Starting point:** main at `0017bbf`, the approved Sprint 4 merge.

**Status:** Backend foundation and invitation Coach controls implemented November 4. Real OpenAI integration and deployment remain unimplemented. Normal startup
returns Coach unavailable; successful suggestions in tests are mocked.

## Current summary — November 4

Superseded in part by the backend implementation entry below; earlier planning
statements describe their own checkpoint.

Latest submitted source is `8614173` (frontend) following `b136587` (backend).
Both were committed/pushed; earlier local-only statements are historical. Claude's
independent review and the approved local fix work are recorded at the end.

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

## November 4 — Approved frontend Coach controls

Shorena explicitly approved the proposed frontend implementation and local mocked
browser testing. The checkout began clean at `b136587`, matching its local origin
tracking reference. The backend foundation and checklist changes had been
separately committed/pushed; earlier uncommitted statements are historical.

Added an optional Coach section after recipient lookup. Draft from my intent
and Refine my message use Natural/Warm/Direct tone choices and explicit Generate
suggestion. The API client sends only action, text, and tone. It validates returned
text and renders it in a separate editable textarea, never HTML. The original
invitation remains unchanged until Use suggestion. Sending is a separate action.

Original-message edits made since generation require replacement confirmation.
The previous message can be restored; restoration also confirms before replacing
later edits. Empty/invisible/overlong suggestions remain editable but cannot be
applied. Keep original dismisses the suggestion and focuses Your message.
Choose Use suggestion or Keep original before requesting another suggestion,
so generation cannot overwrite a written suggestion. Successful invitation send
clears the Coach draft along with the existing invitation draft.

All writing stays in page memory. Cancellation, recipient changes, unmount, and
opening a conversation abort/invalidate generation; late results cannot apply.
Changing person confirms discarding Coach writing and retains the original
invitation message. Cancel also confirms when only Coach text is written.
Generation has a separate busy state: Your message remains editable, sending is
blocked, repeat generation is guarded, and Cancel generation remains available.
An old non-expiry Coach error clears when changing recipients. Session expiry
keeps written text copyable and requires explicit Sign in again; no automatic
redirect occurs from a Coach error. Reload and explicit sign-out can still lose
page-memory drafts; no browser-storage persistence was added.

Native labels/selects, visible focus, live status, and guarded aria-disabled
generation controls support keyboard use. Apply/restore/Keep original focus Your
message; Cancel generation focuses Generate suggestion. Current copy states that
OpenAI live generation is not yet connected, rather than implying mocked results
are real AI. The backend remains unchanged and normally returns 503.

Files: new `frontend/src/coach/{api.js,useCoach.js,Coach.jsx,coach.css}`;
invitation component/hook integration; new `frontend/e2e/ai-coach.spec.js`;
frontend README and Sprint 5 records. A small submission helper keeps existing
send behavior within the project's function-size rule. No lint rule was weakened.

Verification performed:

- Initial new tests exposed inaccurate exact-label locators after controlled
  textarea updates; corrected to accessible textbox-role locators. That run was
  stopped after two locator failures; it is not counted as passing evidence.
- A subsequent targeted run passed 31 Coach/existing-composer tests.
- Full combined mocked Chromium checkpoint passed **108 tests** (92 existing
  plus 16 Coach), with axe scans. Later small feedback cleanup and its additional
  regression passed a separate final targeted run: **33 tests** (17 Coach and
  16 existing composer). Do not call this a 109-test combined pass.
- Whole-project lint and frontend/backend types passed after the final source
  cleanup. Scratch Vite build passed in
  `/private/tmp/callingin-sprint05-ui-build.xWXZmv`; tracked dist was preserved.
- Narrow 390px viewport showed no horizontal overflow, axe scans passed, and the
  synthetic Coach screenshot was visually inspected. This is not an actual phone,
  Safari/VoiceOver check, or the pending human keyboard-only walkthrough.

No backend suite rerun for this frontend-only work; the previous 282-test result
remains separate evidence. No provider call, credential read, installation,
network audit, database change, deployment, Claude review, or Git submission was
performed. Changes remain local pending review. Next: independently review the
controls or separately approve the real OpenAI adapter, privacy disclosure,
model/configuration, credits, and durable budget controls before live testing.

## November 4 — Approved Claude review fixes

Read Claude's [independent review of `8614173`](quality-review-2026-11-04-8614173.md).
Claude recorded 282 backend tests and **109 mocked Chromium tests in one run**,
plus lint/types/formatting/scratch build. These are Claude's measured checkpoint,
separate from the earlier 108 combined / 33 focused implementation results.
The supplied report was untracked when this fix step began and is preserved
unchanged. It does not independently review the subsequent fixes.

Read-only public GitHub API inspection confirmed [Quality run 41863511358](https://github.com/ShorenaK/CallingIn_MasterProject/actions/runs/41863511358)
failed at Browser and accessibility tests. Lint/format/types/backend/build and
Chromium installation passed; audits were skipped. Existing gh credentials returned
401; anonymous metadata succeeded but log download returned 403. The exact hosted
test error was therefore not confirmed. The macOS-only screenshot path is a
source-supported portability problem, not an observed log diagnosis.

Shorena approved the recommended focused fixes. Implemented:

1. Screenshot output uses Playwright's `test.info().outputPath`, removing the
   hard-coded `/private/tmp` dependency from the permanent browser test.
2. Cancel generation remains rendered and focusable, guarded with aria-disabled
   when idle; a late success or error no longer removes the focused control.
3. Repeated Use suggestion preserves the first pre-Coach text. Restore original
   message restores that baseline; confirmation still protects subsequent edits.
4. Backend checks response/socket disconnection before dispatch and again at
   the queued dispatch boundary. A test disconnects during held account lookup
   and confirms no provider call. No real provider was used.
5. Expired lookup recovery renders only the retained invitation message, without
   active Coach controls. Normal Coach-request 401 retains its copyable writing.
6. Unavailable and rate-limit messages differ. Shared ApiError now optionally
   carries validated Retry-After delta-seconds (positive integer, at most 86,400);
   other callers retain their existing error behavior. Arbitrary/date header text
   is not displayed. This is guidance, not a client-side quota bypass or timer.
7. Change person → Keep writing returns focus to Change person; ordinary Cancel
   confirmation still returns focus to Cancel.
8. Backend Coach validation reuses `validInvitationMessage`; frontend uses the
   existing invitation `MESSAGE_MAX`, avoiding independently hard-coded limits.
9. Added current submission/review notes; historical dated records are retained.

Added regressions for held-response focus on success/error, two applies/direct
restore, confirmation opener focus, lookup expiry, safe retry headers, and opening
a conversation while generating. The last test confirms late results are ignored
while invitation/intent text remains when returning.

Verification actually run for this fix step:

- Targeted backend: **16 passed**; full backend coverage: **283 passed**, zero
  failures/skips, **100% lines/functions, 98.33% branches**. Simulated storage and
  provider doubles; new guard branches change the percentage, not the pass count.
- Targeted mocked Chromium: **41 passed** (25 Coach and 16 existing composer).
- Final full combined mocked Chromium suite: **117 passed** in one run (92
  existing and 25 Coach), including axe scans. This is actual local evidence for
  the fixes; Linux hosted Quality has not yet been rerun on them.
- Lint, frontend/backend types, whole-repository formatting passed. Scratch build
  passed at `/private/tmp/callingin-sprint05-review-build.HyFkhT`; tracked dist
  was preserved. Local Markdown links and whitespace checks passed.

No OpenAI call, package installation, private environment read, live database
check, audit, deployment, or Git submission is included. No colors were changed;
Shorena's word “cotorl” was queried to distinguish controls from colors.
These source/docs fixes remain local on top of `8614173`, pending review and a
separate Git flow. A new hosted Quality result will need verification after push;
local Mac success alone does not certify Linux CI. Durable budgets, provider
byte/token bounds, account credit verification, and live integration remain pending.
