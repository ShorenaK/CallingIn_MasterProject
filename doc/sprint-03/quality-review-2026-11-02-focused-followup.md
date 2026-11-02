# Focused follow-up review: findings 4 and 5, 2026-11-02

**Reviewer:** Claude (independent review; no application code changed)
**Branch:** `sprint-03-invitations` at `2f916d6`, uncommitted working-tree changes
**Original report:** [quality-review-2026-11-02-final.md](quality-review-2026-11-02-final.md)

**Scope:** only the two frontend fixes for findings 4 and 5.

| Type             | Files                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Changed source   | `useSendInvitation.js`, `SendInvitation.jsx`, `useInvitationList.js`, `InvitationList.jsx`, `Invitations.jsx` (all in `frontend/src/invitations/`) |
| Regression tests | `frontend/e2e/send-invitation.spec.js`                                                                                                             |

The working tree also contains uncommitted changes to `README.md`,
`browser-accessibility-testing.md`, and `sprint-03-progress.md`. Those are **not**
reviewed here. This is not a repeat of the full sprint review.

## Verdict

| Finding                                                  | Status       | Summary                                                                                                                                                           |
| -------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4: draft lost on lookup expiry after Change person       | **Resolved** | The draft stays visible and read-only for copying, and sign-in happens only when the person chooses it. One low accessibility gap remains in focus handling (A1). |
| 5: old Show more replies affecting a refreshed Sent list | **Resolved** | Old success, error, and 401 replies are all ignored after a refresh. The tests would catch a regression for each outcome.                                         |

Neither fix introduces a blocking problem.

## Checks actually run (this review)

| Check                                                                | Result                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run lint`                                                       | PASS (exit 0)                                                                                          |
| `npm run format:check`                                               | PASS (exit 0)                                                                                          |
| `npm run typecheck`                                                  | PASS (exit 0)                                                                                          |
| Frontend build to scratch `--outDir`                                 | PASS. Tracked `frontend/dist` unchanged (`git diff --quiet frontend/dist`)                             |
| `npx playwright test` (Chromium, mocked APIs, `--output` to scratch) | PASS: **36 passed**, including the 5 new tests at `send-invitation.spec.js:359`, `:392` ×3, and `:485` |
| `grep reloadKey frontend/src`                                        | No remaining references to the removed prop                                                            |

These results match your reported 36 Chromium passes plus lint, types, formatting,
and build.

The following were not run:

- **Backend tests:** the backend has no changes in this diff.
- **npm audits:** they need network access, which was not requested.
- **Manual or live checks.**

`git status --short` was the same before and after the checks. The run regenerated
the Git-ignored `playwright-report/`.

## Finding 4: draft kept on lookup expiry

**What changed**

- In `useSendInvitation.js:38-39`, a 401 during lookup now signs the person out
  immediately only when there is no message. When a message exists, it records the
  same `expired` problem the send path already uses (`lookupProblem` → `sendProblem`,
  `:81-82`).
- In `SendInvitation.jsx:27-31`, when there is no recipient and the problem is
  `expired`, the page shows `RetainedDraft` instead of the email form.
- `RetainedDraft` (`SendInvitation.jsx:38-53`) is a labelled, read-only textarea
  ("Your unsent message").
- `Problem` shows "Your session has ended. Copy your message…" with a **Sign in
  again** button. Sign-in happens only when that button is pressed.

**Correctness**

- The draft can't be edited or sent, but it can be selected and copied. That is
  what a read-only textarea is for.
- The email form is hidden, so no second lookup is attempted with a dead session.
- With no draft, the earlier behaviour stays: the person returns straight to sign-in.
- `send()` now calls `cancel()` after a successful send (`useSendInvitation.js:54`).
  That runs `setReturning(true)` and then `setReturning(false)`. React batches both
  updates, so the final value is `false` and the Sent notice still gets focus. The
  existing send test at `send-invitation.spec.js:72-107` passed.

**Accessibility**

- `Problem` uses `role="alert"`, so the expiry message is announced.
- The textarea has a programmatic label. The axe scan passes in this state
  (`send-invitation.spec.js:381`).

**Regression tests**

- `:359-390`: types a draft, clicks Change person, and has the next lookup return 401. It checks the alert text, the retained value, the `readonly` attribute, the
  axe scan, and that Sign in again leads to a focused "Welcome back".
- `:485-498`: with no draft, a 401 goes straight to sign-in and no retained textarea
  appears.
- With the old code, `:359` would fail. The page would go straight to sign-in, so
  no alert or "Your unsent message" textbox would appear.

**Remaining concerns**

- **A1 (Low, accessibility):** After the lookup 401, the Find person button that had
  focus is removed with the email form (`SendInvitation.jsx:29-30`). Nothing moves
  focus, so it falls to the page body.
  - Screen readers still announce the alert. A keyboard user, though, has to Tab
    from the top of the page to reach Sign in again or the draft.
  - The test clicks the buttons and never checks focus in this state.
  - The send-path expiry test (`:211-231`) doesn't check focus either, so this gap
    already existed. The new path makes it more noticeable, because the form the
    person was using disappears.
  - Possible fix (needs approval): focus the retained textarea or the Sign in again
    button when `RetainedDraft` mounts, and add a `toBeFocused()` check plus a Tab
    step to `:359`.
- **A2 (Info):** `!message` (`useSendInvitation.js:38`) treats a whitespace-only
  draft as present, so the person sees an apparently empty "unsent message" box.
  This matches how Cancel already treats whitespace (it asks for confirmation). It
  is harmless. Using `!message.trim()` would skip the retained view for whitespace,
  if you prefer.

## Finding 5: old Show more replies after a Sent refresh

**What changed**

- `Invitations.jsx:26-31`: the Sent list is now remounted with `key={sentVersion}`
  instead of receiving a `reloadKey` prop. A successful send gives it fresh state:
  new list, new pagination, and an idle Show more.
- `useInvitationList.js`: adds a `generation` counter.
  - Each first-page request takes a new version (`:96-127`).
  - The effect's cleanup increments the counter. Cleanup runs on unmount, on retry,
    and on direction changes.
  - `retry()` also increments it (`:57-62`).
  - `loadMore()` notes the version when it starts. It drops a success or failure
    reply, 401 included, if the version has changed by the time the reply arrives
    (`:64-86`).

**Correctness**

The two changes are both needed:

- The new key alone would make old success and error replies harmless, because state
  updates on an unmounted component are ignored. An old **401** would still call the
  parent's `onSessionExpired` and sign the person out. The version check closes that
  gap.
- The version check alone would not have reset `more.status` or `focusId`. The
  remount does.

Other paths checked:

- **React StrictMode double effects:** the first request's version is invalidated by
  cleanup, so only the second request's reply is applied.
- **Incoming list:** not remounted after a send, which is correct. Its "Refresh list"
  retry path is also protected by the counter. No test covers that path, but the code
  is shared.
- **Behaviour change:** pages already loaded in the Sent list are cleared after a
  send. That was already the case with `reloadKey`, so nothing is lost.

**Accessibility**

- The remounted list shows its existing "Loading sent invitations…" status.
- Focus stays on the Sent notice. The list remount doesn't move focus, so nothing is
  lost there.

**Regression tests (`:392-434`, run once each for success, error, and expired)**

- The old `cursor=old` request is held until the new first page has loaded.
  `toBeEnabled()` on Show more proves the old loading state was reset.
- **Old success:** after release, exactly one card shows and "Stale page" is absent.
  The final click must request `fresh`. With the old code, the stale page would have
  set `nextCursor` to `stale`, and `cursors` would then not equal `['fresh']`.
- **Old error:** the test checks there is no alert. The final click would also fail
  if the error state had hidden Show more.
- **Old 401:** the test asserts nothing about it directly. Being signed out would
  still fail the test: the Sent region would disappear and `more.click()` would fail.
- The later `page.route` override for `cursor=old` takes precedence over the general
  mock. `cursors` equalling `['fresh']` confirms the general mock never saw `old`.
  The `if (cursor === 'old')` branch in `mockStalePage` (`:461`) is therefore never
  reached. It is harmless.

**Remaining concerns**

- **B1 (Low, test robustness):** The `toHaveCount(0)` checks at `:425-427` pass as
  soon as the condition holds. If a stale render were delayed, they could pass before
  it arrived. Two things limit this risk:
  - The one-frame wait at `:424`.
  - The positive checks that follow (`more.click()` and `cursors` equalling
    `['fresh']`), which would catch a stale success or 401.

  For the error outcome, an extra positive check would make the test stronger, for
  example checking that Show more is still visible right before clicking it. This is
  optional.

## Verification limits

- All browser evidence uses **mocked APIs in Chromium only**.
- **Unverified, carried into Sprint 4:**
  - Keyboard-only use and VoiceOver in the running app.
  - Safari, 200% zoom, and phone width.
  - Copying the retained draft in a real browser session.
  - Real session expiry against the live backend and Atlas.
- I did not mutation-test the fixes, because changing application code wasn't
  permitted. My claims that the tests would fail with the old code come from reading
  the code, not from running it.
- Hosted GitHub Quality results and npm audits were not checked (network).

## Proposed fixes (each needs separate approval; none applied)

1. **A1:** Move focus to the retained draft, or to Sign in again, when the lookup
   expiry state appears. Add a focus check to `send-invitation.spec.js:359`.
2. **A2 (optional):** Use `!message.trim()` at `useSendInvitation.js:38`.
3. **B1 (optional):** Add a positive "Show more is visible" check before the final
   click in the stale-reply tests.

None of these blocks closing findings 4 and 5.
