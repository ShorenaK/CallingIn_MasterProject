# Quality review: sprint-04-conversations, 2026-11-03, scope: follow-up fixes

This is Claude's focused, read-only `/quality-review` of the approved follow-ups to
the [complete Sprint 4 review at `589032c`](quality-review-2026-11-03-589032c.md).
The scope is limited to:

1. Refresh / Load older focus and announcement, with regression tests.
2. Stale frontend documentation and Sprint 4 notes.
3. Opening-error and keyboard-navigation tests.

No application code was edited. No branch change, staging, commit, push, merge,
installation, network check, or live database access was performed.

## Checkout

| Item       | Value                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch     | `sprint-04-conversations`                                                                                                                                                                |
| Reviewed   | Working-tree changes on top of `1304763`. During the check run they were committed as **`a4bc652`** (18:20:16 EST) and pushed (branch matches origin).                                   |
| Match      | `git diff 1304763 a4bc652` has the same 8 files and line counts as the reviewed working tree: the 6 changed files, the new `conversation-review.spec.js`, and the earlier review report. |
| Backend    | No backend source changed                                                                                                                                                                |
| Shared cfg | No change to ESLint, tsconfig, package manifests, Playwright config, workflow, or hooks                                                                                                  |

## Summary

All three follow-ups are implemented and covered by meaningful tests. All local
checks passed. Two new low findings and one documentation nit; no blockers.

| Check                        | Result        | Key detail                                                                  |
| ---------------------------- | ------------- | --------------------------------------------------------------------------- |
| `npm run lint`               | PASS          |                                                                             |
| `npm run format:check`       | PASS          |                                                                             |
| `npm run typecheck`          | PASS          | Frontend and backend                                                        |
| `npm run test:coverage`      | PASS          | 267 pass, 0 fail/skipped; 100% lines/functions, 98.35% branches (unchanged) |
| Scratch build                | PASS          | `--outDir` in the session scratchpad; tracked `frontend/dist` unchanged     |
| `npx playwright test`        | PASS          | **92 passed** (79 + 13 new), Chromium only, all APIs mocked                 |
| Root/frontend/backend audits | NOT COMPLETED | Need network; not run without approval                                      |
| GitHub Quality for `a4bc652` | NOT COMPLETED | Needs network; not run without approval                                     |

Files created or changed by checks: no tracked files. Playwright rewrote the
ignored `playwright-report/` folder. `frontend/dist/index.html` keeps its
October 16 timestamp.

## Follow-up verification (reviewer reading plus measured tests)

### 1. Focus and announcement: fixed

- Refresh messages and Load older messages now use `aria-disabled` while loading,
  so they stay focusable (`Conversation.jsx:84-85`, `:267-268`). They are still
  truly `disabled` on expiry or while sending.
- Repeat activation is blocked by a `loading` ref (`useConversation.js:117-118`).
  It is reset only by the current request's `finally` (`:169-171`), so a stale
  request cannot unlock it. Load older keeps its `morePending` guard.
- A completed history load sets the status notice "Messages updated."
  (`useConversation.js:147-152`).
- Tests (`conversation-review.spec.js:19-97`) press Enter, then assert:
  - focus stays on the button during and after loading;
  - `aria-disabled="true"`;
  - a second Enter sends no extra request (`state.reads` length 2);
  - the status text appears;
  - focus is retained after refresh and older-page failures;
  - a successful older-page retry with Enter focuses the loaded message;
  - the axe scan passes.
- These assertions would fail against `589032c`, where the scratch probe recorded
  in the earlier report saw focus fall to `<body>`. Codex's statement that the
  new tests failed before the fix was not independently re-run.

### 2. Documentation: fixed

- `frontend/README.md:31-43` no longer mentions the removed health request and
  correctly lists the implemented features. "The health endpoint remains
  available" matches `backend/src/app.js:56`. The `npm start` instruction is in
  `backend/`, where that script exists.
- `sprint-04-progress.md` and `sprint-4.md` now give:
  - the right review status;
  - the battery colours matching `social-battery.css:67-73`;
  - test counts labelled as historical;
  - the Social Battery discrepancy recorded as a stale prompt.
- The stated counts match this run: 13 new tests (1 + 1 + 1 + 2 + 1 + 2 + 2 + 2 + 1
  in `conversation-review.spec.js`) and 92 total. "Claude independently reran
  those checks" (79/267 at `589032c`) is accurate.

### 3. Opening-error and keyboard tests: added

- `useConversation.js:29-35` hides Try again only for 404/409 `ApiError`s. A 503
  or malformed response keeps retry. 401 still follows the expiry path.
- Tests (`conversation-review.spec.js:99-285`) cover:
  - 404/409 with no Try again, Send disabled, and Back focusing Open conversation;
  - 401 focusing the retained reply, loading no history, then explicit sign-in;
  - malformed and mismatched rooms rejected without a history read;
  - late 200 and late 401 opening responses after Back, which restore nothing and
    do not sign out;
  - 400/404 send failures keeping the text and focusing the reply;
  - a full Tab / Shift+Tab pass through every conversation control and the
    confirmation, with Keep writing returning focus to the reply.
- Keep writing now always focuses the reply (`Conversation.jsx:206-210`). The
  updated assertion is `conversations.spec.js:147`.

## Judged: new findings

| #   | Severity   | file:line                                               | Finding                                                                                                                                                                    | Why it matters                                                                    | Proposed fix                                                                                     |
| --- | ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A   | Low        | `frontend/src/App.css:87-93`                            | Only `button:disabled` gets the faded/wait style. `button:hover:enabled` still applies to `aria-disabled` buttons, so Refresh and Load older look clickable while loading. | Mouse users may click again. This is harmless because repeat presses are ignored. | Give `button[aria-disabled='true']` the same style and exclude it from the hover rule. CSS only. |
| B   | Low (copy) | `frontend/src/conversations/useConversation.js:147-152` | "Messages updated." is announced on the first history load too, not only after Refresh.                                                                                    | A screen-reader user hears "updated" when nothing changed.                        | Announce only after a refresh, or use "Messages loaded." for the first load. Shorena's choice.   |
| C   | Very low   | `frontend/README.md:65`                                 | The example `--outDir /private/tmp/callingin-review-build` leaves out `--emptyOutDir`.                                                                                     | Repeated builds keep stale files, and Vite warns.                                 | Add `--emptyOutDir`.                                                                             |

## Evidence types

- **Simulated backend tests:** run here; backend unchanged since `589032c`.
- **Mocked Chromium browser tests:** run here, 92 passed.
- **Scratch focus probe:** run against `589032c` in the earlier review only.
- **Live Atlas:** no new live result.
- **Human accessibility:** no human check.

The Tab-order test proves the order of focus, not that the focus ring is visible.

## Manual checklist (NOT CHECKED)

- [ ] Keyboard-only navigation and visible focus (human): NOT CHECKED
- [ ] Screen reader pass, including the new announcement: NOT CHECKED
- [ ] Safari, 200% zoom, actual phone: NOT CHECKED
- [ ] Live MongoDB/Atlas behavior: NOT CHECKED
- [ ] Security judgment: NOT CHECKED (no security-relevant change in scope)
- [ ] UX copy and tone (finding B): NOT CHECKED

## Not checked

- npm audits and GitHub Quality for `a4bc652` (network).
- Live Atlas, restart, backup, and the remaining live/human items listed in
  `sprint-04-progress.md`.
- Areas outside the three follow-ups. The `589032c` report remains the full-scope review.

## Proposed fixes (none applied)

1. Finding A: style `aria-disabled` buttons as busy. Recommended.
2. Finding B: limit or reword the first-load announcement. Optional; Shorena's wording choice.
3. Finding C: add `--emptyOutDir` to the README example. Optional.

Awaiting Shorena's choice. Codex implements approved fixes.
