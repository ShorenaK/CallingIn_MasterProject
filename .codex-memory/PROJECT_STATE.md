# CallingIn — Current project state

**Snapshot:** November 2, 2026 (America/New_York). Supersedes the October 29
snapshot, preserved in session 002. Verify source/Git before acting.

## Git and handoff

- **Sprint 3 merged and pushed to main: `0921e62`.** Approved non-fast-forward
  merge, parents `1c2c40e` and `2b9912c`, no conflicts. Branches retained.
- Main checkout: `/private/tmp/CallingIn-main-followups-20261102`, matching
  origin/main at the save checkpoint. Temporary path: use `git worktree list`.
- Desktop checkout: `/Users/shorenaanzhilov/Desktop/CallingIn`, now on new
  **`sprint-04-conversations` at `0921e62`**, created from merged main after
  Shorena explicitly requested Sprint 4 setup. This branch has not been pushed.
  The retained Sprint 3 branch remains at `2b9912c`, matching origin.
- Session 003 and supporting memory were saved locally on main, then copied
  into Sprint 4 at Shorena's request so the next chat can read them directly.
  Main's originals remain intact and uncommitted. Sprint 4's copied memory and
  this updated checkout note are also uncommitted; no Git submission is implied.
- The branch/setup request does not approve Sprint 4 application implementation.
  No runtime code, database, or dependency changes were made during setup.
- Origin redirects CallingIn_new to CallingIn_MasterProject. Git works; authenticated
  gh CLI failed, but public curl GitHub API reads confirmed CI without credentials.

## Implemented architecture and policy

React 19/Vite + Express 5 + native MongoDB driver, JavaScript with strict checkJs/
JSDoc. Preserve frontend/backend layout. Node 26.0.0 selected, engines Node 26.x.
Never open private .env or print connection settings during routine review.

Accounts: registration, login/logout, Mongo-backed HttpOnly cookie sessions,
90-day optional inactivity persistence, session regeneration, name-only profile
editing, origin/JSON protection, verified account guards, and safe logging.
New passwords: **8–18 characters**, no whitespace or full email substring
(case-insensitive), no composition requirement. Legacy login supports 8–128
including whitespace. Show/Hide supported; no silent registration truncation.
Google sign-in is future work.

Login: **10 credential failures/email/15 min**, **100 total requests/IP/15 min**,
normalized email across IPs. Successful completion refunds the email slot, does
not erase failures; invalid input/service errors also refund. In-flight slots
can temporarily block; aborted slots can persist to expiry. Accepted lockout/NAT
trade-offs recorded. Process-local stores, reset on restart; shared store and
trusted-proxy design needed for deployment. Registration remains 5/IP/15 min.

Invitations: exact-email lookup returns ID/display name; self/missing share 404;
lookup quota 10/account/15 min. Create derives sender from verified session,
trims messages to **1–5,000 UTF-16 code units**; independent 16 KB JSON guard.
Authorized incoming/outgoing lists and cursor pagination (frontend pages 10),
current counterpart names without emails. Recipient-only pending → deferred/
accepted/declined; deferred → accepted/declined; repeated choice idempotent,
final decisions irreversible. Unique unordered pair **blocks repeats forever**,
including after decline. The proposed 30-day policy is NOT implemented.
Strict/error schema, expected indexes, startup checks stored validators exactly;
no automatic collMod. Existing Atlas validators require deliberate migration.

Frontend: send/compose/counter, lists/Show more, final-choice confirmation,
Cancel/Keep writing/Discard draft, status text/shapes, error/expiry handling.
Sender Maybe Later: "Your invitation is still open; please wait."
Retained drafts remain visible/copyable on lookup expiry and receive keyboard
focus; sign-in is explicit. Old pagination success/error/401 replies cannot
affect a remounted/refreshed Sent list. Accept records consent only; no private
messaging or conversation creation is implemented yet.

## Verification and reviews

Actual merged-checkout November 2 results: **176 backend tests passed**, coverage
**100% lines/functions, 98.36% branches**; **36 Chromium tests passed**, with axe;
lint, type checks, formatting, whitespace checks, and scratch build passed.
All three fresh npm audits reported zero vulnerabilities. Backend DB is simulated;
browser APIs mocked. No frontend coverage measured. Tracked dist preserved.

Targeted minimatch **11.0.1** overrides under ESLint and @eslint/config-array fix
the reported advisory. Do not run npm audit fix --force or weaken CI gates.
Revisit the cross-major override when upstream ranges support a patched release.

Claude full review at `2f916d6`: no blockers; docs and two low frontend issues.
Codex fixed docs, lost draft on lookup expiry, and stale pagination. Claude's
focused follow-up confirmed both fixes and 36 tests. A final tiny focus fix was
separately approved/tested and included in the full merge verification.

**Checked during this save:** main merge `0921e62` GitHub Quality **completed,
success**, independently read from public API:
[post-merge run](https://github.com/ShorenaK/CallingIn_MasterProject/actions/runs/41518218582).
Parent Sprint/main checks also passed before merge. No suites or audits rerun
merely for this save; do not imply a future memory commit has passed CI.

## Scope closure and unfinished work

Sprint 3 is closed for its approved implementation scope. Shorena explicitly
carried remaining live/manual checks into Sprint 4: login limits, Cancel/draft
recovery/copying, message boundaries, human keyboard-only test, VoiceOver, Safari,
200% zoom, phone layout, and outstanding Atlas startup/backup evidence. These
remain unverified. User reported updating 5,000 validators in `callingin_dev`
and `callingin_sprint03_verify`; no new agent-run live certification.

[Central deferred tasks](../doc/deferred-tasks.md): revisit palette, envelope/icon
and emoji, display messages, hyphen/general copy cleanup, 30-day re-invitation,
Google sign-in, deployment protection trade-offs, and override exit condition.
These are not all automatically Sprint 4 scope. Earlier lookup asymmetry remains
unreproduced; shared cookies across tabs are a hypothesis. User requested moving on.

## Next: Sprint 4 Conversations

Read [sprint plan](../doc/sprint-plan.md), README, deferred list, and latest
[Sprint 3 progress](../doc/sprint-03/sprint-03-progress.md). Plan says private
messaging, participant-only access, basic Social Battery, and invitation-to-
conversation tests; intended branch `sprint-04-conversations`. AI Coach is Sprint 5.
Explain the proposed first backend step with WHAT/WHY/HOW/WHERE/IMPACT/
RECOMMENDATION, wait for approval, then proceed one step at a time. Saving/restoring
is not permission to implement, switch branches, create a worktree, install, or submit.

Restore [session 003](sessions/003-sprint-03-closeout-and-sprint-04-handoff.md).
Use short plain explanations and life analogies. Codex implements, Claude reviews,
Shorena approves; one editor/task. No full transcript archived. A save is not a
Git submission: obtain separate approval to commit/push these local memory files.
