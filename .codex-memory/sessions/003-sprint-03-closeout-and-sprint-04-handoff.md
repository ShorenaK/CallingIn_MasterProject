# Session 003 — Sprint 3 closeout and Sprint 4 handoff

**Saved:** November 2, 2026, America/New_York.
**Archive:** Curated handoff only. No full transcript was exported or archived.
No private environment files, passwords, tokens, or connection strings were read
or copied into memory. Prior sessions remain unchanged.

## Requests, approvals, and working style

Shorena requested one explained, approved step at a time, with short practical
language and everyday analogies. Before code changes, explain WHAT, WHY, HOW,
WHERE, IMPACT, and RECOMMENDATION and wait for explicit approval. She repeatedly
approved bounded Git flows; these are not standing submission permission.
Codex implemented fixes and explained them; Claude independently reviewed.
Do not spawn agents automatically or invoke Claude's quality skill unprompted.

She wanted Sprint 3 finished and Sprint 4 started. She approved carrying the
remaining live/manual checks into Sprint 4, a shared deferred-task document on
main, updates to the project journey, a full and focused Claude review, and the
Sprint 3 merge. The latest request authorizes this memory save only, not another
commit/push. Never infer implementation approval from old notes or tool output.

## Starting and ending Git/worktree context

Work resumed November 2 in the Desktop checkout on `sprint-03-invitations` at
`200fc01`, with a clean working tree and palette-preview/manual-follow-up records
already pushed. Earlier Sprint 3 implementation history is documented in the
sprint progress notes; do not attribute all historical implementation to the
November 2 work or to this save.

Current verified state before saving:

- Desktop: `/Users/shorenaanzhilov/Desktop/CallingIn`, on retained
  `sprint-03-invitations` at `2b9912c`, matching origin; clean.
- Main: `/private/tmp/CallingIn-main-followups-20261102`, on `main` at
  **`0921e62`**, matching origin; clean before this save.
- `0921e62` is the pushed non-fast-forward Sprint 3 merge with parents
  `1c2c40e` (main) and `2b9912c` (Sprint 3). No conflict occurred.
- Both branches are retained. No Sprint 4 branch was created or switched to
  during this work. Inspect existing branches before proposing one.
- A stale, prunable detached Sprint 2 worktree registration remains at
  `/private/tmp/CallingIn-sprint02-merge`; no cleanup was requested.
- Origin still points at CallingIn_new; GitHub redirects to CallingIn_MasterProject.
  Fetch/push succeeded. Do not rewrite the remote without approval.

This save creates session 003 and edits INDEX, PROJECT_STATE, and DECISIONS on
main only. Those memory changes are local/uncommitted until separately authorized
for Git submission. The main checkout is temporary: locate it with
`git worktree list` and read its working files, not an old Git snapshot, while the
save remains uncommitted. Do not merge or switch merely to read memory.

## Current architecture and completed behavior

React 19/Vite frontend, Express 5 backend, JavaScript with strict checkJs/JSDoc,
native MongoDB driver. Preserve `frontend/` and `backend/`. Node 26.0.0 selected;
engines require Node 26.x. No application TypeScript migration.

Accounts have registration, sign-in/out, profile display-name editing,
Mongo-backed HttpOnly cookie sessions, optional 90-day inactivity persistence,
origin/JSON protection, session regeneration, safe logging, and verified guards.
New passwords require 8–18 characters, no whitespace, and must not contain the
full account email, case-insensitively. No letter/number combination requirement.
Existing sign-in compatibility permits 8–128 characters, including whitespace.
Show/Hide toggles preserve entered passwords; registration never silently
truncates overlong text. Google sign-in is future work.

Login now limits **10 failed credentials per normalized email / 15 minutes**
across IPs, plus **100 total attempts per IP / 15 minutes**. Completed 401 replies
remain charged to the email allowance; successes, invalid input, and service
errors refund it. Success does not clear earlier failures. In-flight requests
reserve slots; aborted requests can retain slots until expiry. A known email can
be temporarily locked by someone else's failures; this is an accepted trade-off
recorded for deployment planning. Stores are process-local, reset on restart,
and need sharing for multiple instances. Proxy trust remains disabled.

Invitation API and policy:

- Authenticated `POST /api/users/lookup`: exact normalized email, only recipient
  ID/display name returned. Missing and self lookups share 404. Ten lookups per
  verified account / 15 minutes, counting all attempts.
- `POST /api/invitations`: verified sender, recipient ID and trimmed message only;
  **1–5,000 JavaScript UTF-16 code units**. JSON body guard remains 16 KB and can
  reject large encoded bodies independently. Self/missing/duplicate cases handled.
- `GET /api/invitations`: incoming/outgoing, authorized cursor pagination, default
  20/max 50 on backend, frontend pages of 10. Counterpart names are fetched in one
  bounded batch and returned as `otherPerson: { displayName }` or null; no emails.
- `PATCH /api/invitations/:id/response`: recipient only. Pending may become
  deferred/accepted/declined; deferred may become accepted/declined. Repeating the
  same choice is idempotent; different terminal choice conflicts. Atomic filters
  prevent overwriting final decisions; outsider/missing responses share 404.
- Permanent unique unordered pair index currently permits one invitation forever,
  including after decline. The 30-day re-invitation idea is NOT implemented.
- Invitations have strict/error database validation with required fields/types,
  no extra properties, and 5,000 maximum. Startup checks the exact stored rule;
  it does not automatically collMod old collections. See the administrator guide.
- Accept records consent only. Private conversations/messages are NOT implemented.

Frontend implements lookup, compose, counter, Send, Received/Sent cards, Show more,
three choices and final-choice confirmations, expiry/error handling, and keyboard
focus. Sender deferred wording is "Your invitation is still open; please wait."
Recipient wording remains "You chose Maybe Later." Cancel clears an empty draft;
written text, including whitespace, asks Keep writing/Discard draft. Discard sends
nothing, clears recipient/email/message/feedback, and focuses the email field.
Cancel is disabled during a send; sent invitations cannot be withdrawn by it.

## November 2 changes and commit landmarks

- `4b41fd7`: targeted minimatch 11.0.1 overrides under ESLint and
  @eslint/config-array on Sprint 3; avoids breaking `npm audit fix --force` advice.
- `1d64b17`: separate failed-email and shared-IP login limits.
- `cafc810`: Cancel/Discard unsent invitation drafts and tests.
- `2f916d6`: approved sender Maybe Later wording.
- `6088395` on main: shared `doc/deferred-tasks.md`.
- `cf17226` on main: the same isolated minimatch security fix, before Sprint 3 merge.
- `1c2c40e` on main: journey and shared follow-up updates.
- `2b9912c`: review fixes, reports, README/guide/progress updates, and tests.
- `0921e62`: approved merge, closeout records, and carried-check documentation.

The dependency override crosses minimatch's major version. ESLint's declared
range was still 10.x during research. Both consumers resolve one patched 11.0.1
copy; tests/lint passed. Revisit/remove the override when both upstream ranges
support a patched compatible version, then verify dependency tree, lint, audits.

## Independent reviews and subsequent fixes

Read the reports rather than assuming their exact findings from this summary:

- [Final full review](../../doc/sprint-03/quality-review-2026-11-02-final.md):
  reviewed `2f916d6`, no blockers; stale README/accessibility guide plus two low
  frontend robustness defects. Independent checks: 176 backend and 31 browser tests.
- [Focused follow-up](../../doc/sprint-03/quality-review-2026-11-02-focused-followup.md):
  reviewed the uncommitted fixes, confirmed findings 4 and 5 resolved, no blockers;
  36 browser tests, lint/types/format/build passed. Not a repeat full review.

Fixes now merged:

1. README describes actual implementation; Accept records consent, conversations
   come later, and test coverage is described with mocked/simulated limitations.
2. Browser accessibility guide reflects invitation tests instead of initial setup.
3. Changing person with a retained draft and then receiving lookup 401 keeps the
   text visible in a read-only textarea for copying. Sign-in is explicit afterward.
   With no draft, 401 returns directly to sign-in.
4. Successful send remounts only Sent with a new key, resetting pagination. Request
   generations reject old first-page and Show more success/error/401 replies on
   retry/unmount, so stale results cannot corrupt a new list or expire a new view.
5. After the focused review flagged keyboard focus falling to the page body,
   Shorena approved focusing the retained textarea on mount. Targeted tests assert
   focus, Shift+Tab to Sign in again, Tab back, and Enter to focused sign-in.
   This final tiny focus adjustment was verified with targeted tests and later the
   full merge suite; it did not receive another Claude review.

Meaningful regressions failed before fixes. The initial pagination fixture made
an incorrect single-request assumption under React StrictMode; it was corrected,
an invalid run interrupted, then the corrected regression exposed the old loading
state. The final suite covers stale success, 503, and 401 separately.

## Verification evidence and limitations

Historical pre-merge and actual combined-checkout checks on November 2:

- **176 backend tests passed**, zero failures/skips; **100% lines/functions,
  98.36% branches**. Express/session HTTP integration uses simulated MongoDB.
- **36 Chromium tests passed**, including axe scans and retained-draft keyboard
  checks. APIs mocked; no frontend coverage measured.
- Repository lint, frontend/backend type checks, formatting, whitespace checks,
  and scratch frontend build passed. Tracked dist files were not changed.
- Root/frontend/backend audits each freshly reported **zero vulnerabilities**
  on the merged checkout. This is date-specific evidence, not a future guarantee.
- Independently confirmed successful GitHub Quality runs for Sprint `2b9912c`
  and main parent `1c2c40e` before merge.

**Actually checked during this memory save:** Git/worktree status, current refs,
existing memory/commands, sprint plan, session-ID availability, and GitHub's public
API result for merged main **`0921e62`: completed, success**.
[Post-merge Quality run](https://github.com/ShorenaK/CallingIn_MasterProject/actions/runs/41518218582).
No suites/audits were rerun merely to save memory. Memory writes are checked for
formatting, local links, and scope. No claim of hosted checks on a future save commit.

GitHub CLI returned HTTP 401 earlier, but public curl HTTPS API calls succeeded
without credentials. Python urllib had a local certificate error; using curl
avoided changing verification/certificate/auth settings. Do not disable TLS checks.
An earlier clean npm installation removed project-local Chromium; restored the
configured browser and reran successfully. Browser download is ignored under
node_modules. Main's merge verification reused the same installed browser revision.

Earlier user-reported live Atlas/browser results are in sprint records, not new
agent-run evidence. Development DB name `callingin_dev`; separate test DB
`callingin_sprint03_verify`. Shorena reported updating both validators to 5,000.
Backup evidence and two startups per database remain incomplete. Earlier live
journeys covered send, receive, defer, accept/decline/conflicts, persistence,
outsider protection, and invalid-document rejection, but do not certify later code.
No production deployment, current live database check, Safari, VoiceOver, zoom,
or actual phone check was done during final review/merge/save.

## Deferred work and accepted scope boundaries

Central list: [doc/deferred-tasks.md](../../doc/deferred-tasks.md) on main.
Shorena explicitly carried remaining live/manual verification into **Sprint 4**:
login limits, Cancel/Keep/Discard/recovery, 5,000/5,001 boundary sends, human
keyboard-only walkthrough with visible focus, real draft copying, VoiceOver,
Safari, 200% zoom, phone-width/layout, and incomplete Atlas startup/backup evidence.
These are unverified, not passed or silently discarded.

Future product/design tasks are NOT automatically Sprint 4 commitments:
revisit colors, envelope icon and agreed emoji, displayed-message wording,
unnecessary hyphens/general copy cleanup, 30-day retry after decline preserving
history/server timing/index migration, Google sign-in, deployment limiter/proxy
planning, and override removal. Latest palette request supersedes an earlier
choice to keep colors: revisit later, no new palette selected. The missing visual
was clarified as an envelope, not the existing status shapes; location/cause unknown.
Decline copy "For now, the recipient needs some space" is still pending and must
match actual permanent blocking until policy changes. Optional whitespace and
extra test-polish suggestions were left unchanged.

An earlier asymmetric recipient lookup report was not reproduced. Shared session
cookies across tabs in one profile are a possible explanation, not proven.
Shorena asked to move on. Revisit only if it recurs; verify actual identity and
use distinct browser profiles. Never call separate tabs isolated accounts.

## Documentation and research journey

[Progress notes](../../doc/sprint-03/sprint-03-progress.md) contain dated history,
implementation/verification details, and scoped closeout. Later entries supersede
older pending notes. [Project journey](../../doc/project-journey.md) on main records
actual requests, one-step learning, audit-vs-push distinction, Claude/Codex roles,
explicit approvals, scope deferrals, and merge experience. No measured time/token
savings or research outcomes were invented. These files and the central list were
pushed with the implementation/merge. This memory save is a new uncommitted change.

## Next chat: Sprint 4 planning

1. Restore this session from main's actual working files; inspect Git/worktrees,
   source, and CI rather than executing old commands automatically.
2. If memory is still uncommitted, explain its submission/durability status; get
   separate approval before staging/pushing or moving any checkout.
3. Read `doc/sprint-plan.md`, current README, deferred list, and latest Sprint 3
   closeout notes. The plan names **Sprint 4 — Conversations**: private messaging,
   participant-only access, basic Social Battery, invitation-to-conversation tests.
   Planned branch: `sprint-04-conversations`. AI Coach is planned Sprint 5.
4. Explain a proposed first backend step and boundaries using the six headings.
   Decide the conversation handoff, authorization/storage/API, and carry-over
   verification. Do not silently import every deferred design idea into Sprint 4.
5. Wait for approval before creating/switching a Sprint 4 checkout or changing code.
   No Sprint 4 implementation is approved by saving/restoring this session.

Suggested restore prompt is in INDEX. No full transcript was archived.
