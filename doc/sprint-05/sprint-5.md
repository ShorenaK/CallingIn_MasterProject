# Sprint 5 — AI Coach plan and checklist

**Prepared:** November 3, 2026 (America/New_York)

**Branch:** `sprint-05-ai-coach`, from main merge `0017bbf`.

**Semester target:** November 10–23; advisor review target November 24.

**Next meeting:** [Meeting 5 — Tuesday, November 10](../meetings/meeting-5_2026-11-10.md).

## Intended scope

The [semester plan](../sprint-plan.md) calls for AI drafting, editable suggestions,
tone refinement, failure handling, and an integrated MVP. The user remains in
control: AI provides a suggestion, the user reviews/edits it, and only an explicit
user action sends an invitation. Existing account, invitation, conversation,
and Social Battery behavior forms the starting point.

The items below are planning tasks, not approval of every design detail.

## 1. Agree on the design before implementation

- [x] Inspect the current compose flow and identify where AI assistance belongs.
      Completed during the November 4 design work.
- [x] Explain the first backend-only foundation using all six headings and obtain
      explicit approval. Implemented November 4 with test doubles; no live calls.
- [x] Compare provider options; Shorena chose OpenAI as the provider direction.
- [ ] Confirm the exact model and integration details after design review; Terra
      remains the initial evaluation candidate, not an approved live integration.
- [ ] Agree on the user's intent input, available tone choices, and how original
      text and suggestions remain editable without losing a draft.
- [ ] Agree on the exact data sent to the provider and the user-facing privacy
      explanation. Do not automatically include conversation history, other
      people's private messages, emails, or stored account data.
- [ ] Agree on server-side credentials/configuration, timeouts, request limits,
      cost controls, response validation, and safe logging before implementation.
- [ ] Define how to handle rejected input, unavailable providers, empty or
      malformed output, overlong drafts, and interrupted/late requests.

## 2. Implement approved steps

- [x] Add the authenticated backend endpoint, validated provider boundary,
      deadline/cancellation, and process-local development limits (November 4).
- [ ] Add the separately approved real OpenAI adapter, server-only credentials,
      provider response byte/token bounds, and durable spending controls.
- [x] Add foundation input/output validation and request protection using the
      project's existing guards and text rules where appropriate.
- [ ] Add the AI controls to invitation composition without automatic sending.
- [ ] Preserve user-written text during generating, retry, editing, session expiry,
      and navigation; agree before replacing a written draft.
- [ ] Integrate the reviewed suggestion with the existing send/response/chat journey.
- [ ] Document the implemented API and setup only after those decisions exist.

## 3. Meaningful verification

- [x] Backend foundation tests: authentication, allowed input, limits, provider timeout/errors,
      malformed/empty/overlong output, safe logs, and approved provider-boundary
      behavior using controlled test doubles.
      November 4: 15 new Coach tests; full backend suite 282 passed. Real provider
      protocol/usage and durable quota behavior still require separate tests.
- [ ] Browser tests: explicit generation, editable suggestion, keeping original
      text, failure/retry, expiry, stale requests, keyboard focus, and no auto-send.
- [ ] Run existing accounts/invitations/messages/battery tests for regressions.
- [ ] Obtain approval for any live provider/network check and record actual model,
      cost/data boundaries, outcomes, and limitations. Never print secrets.
- [ ] Prepare evaluation scenarios for authentic intent, tone, and user control.
      Record observations honestly; do not invent research measurements.
- [ ] Update the paper draft/evaluation preparation as called for by the plan.

## 4. Focused carry-over work — updated November 4

Shorena requested a shorter active list because Sprint 4 implementation and
review work is complete. Keep these follow-ups visible; this does not authorize
implementation of the deferred features.

- [ ] Complete the human keyboard-only walkthrough in Sprint 5: Tab, Shift+Tab,
      Enter, and Space across accounts, invitations, conversations, battery, and
      later AI controls. Check focus, errors, confirmation, and retained-draft copying.
- [ ] Separately design the 30-day invitation retry after a decline, preserving
      history and enforcing server timing. It is not implemented or approved to code.
- [ ] Review deployment protections and the dependency override: reconsider login
      delays/recovery before deployment, review shared limits/proxy settings, and
      retain the minimatch override until a verified compatible fix exists.

Current login policy remains approved: ten failed credentials can temporarily
block an email across IPs; the 100-request IP ceiling is shared by people using
one network. Changes need their own explained design and approval.

Use the [central deferred-task record](../deferred-tasks.md) for completion
status and detailed follow-ups. The earlier evidence gaps are retained in the
[Sprint 4 live report](../sprint-04/live-verification-2026-11-03.md#remaining-limits-and-checks)
and dated progress records rather than repeated here. Removing duplicate bullets
is not evidence that restart/database/backup, all accessibility/browser checks,
or the merge's hosted Quality result passed. No new checks were run for this cleanup.

## 5. Independent review and closeout

- [ ] Have Claude manually run the existing quality-review skill after the
      approved implementation and tests. Record reviewed commit/scope and results.
- [ ] Explain findings, obtain approval for fixes, and verify affected behavior.
- [ ] Update progress, command/API/setup documentation, and measured research notes.
- [ ] Run relevant final checks and a scratch build; ask before new network audits.
- [ ] Obtain separate Git submission and final Sprint 5 merge approval.

## Scope boundaries

No new AI behavior, package, subscription/payment feature, automatic message
sending, 30-day re-invitation policy, or bulk UI redesign is approved by setup.
Other requested edits need their own explained approval. Preserve existing
branches, records, private messages, and test data; no cleanup is implied.
