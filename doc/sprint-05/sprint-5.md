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

- [ ] Inspect the current compose flow and identify where AI assistance belongs.
- [ ] Explain the first backend step using WHAT, WHY, HOW, WHERE, IMPACT, and
      RECOMMENDATION; obtain explicit implementation approval.
- [ ] Choose the AI provider/model and integration approach after reviewing
      capabilities, current costs, and configuration needs. No choice is made here.
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

- [ ] Add the agreed authenticated backend drafting/refinement endpoint and
      provider integration. Keep credentials on the backend.
- [ ] Add approved input/output validation and request protection using the
      project's existing guards and text rules where appropriate.
- [ ] Add the AI controls to invitation composition without automatic sending.
- [ ] Preserve user-written text during generating, retry, editing, session expiry,
      and navigation; agree before replacing a written draft.
- [ ] Integrate the reviewed suggestion with the existing send/response/chat journey.
- [ ] Document the implemented API and setup only after those decisions exist.

## 3. Meaningful verification

- [ ] Backend tests: authentication, allowed input, limits, provider timeout/errors,
      malformed/empty/overlong output, safe logs, and approved provider-boundary
      behavior using controlled test doubles.
- [ ] Browser tests: explicit generation, editable suggestion, keeping original
      text, failure/retry, expiry, stale requests, keyboard focus, and no auto-send.
- [ ] Run existing accounts/invitations/messages/battery tests for regressions.
- [ ] Obtain approval for any live provider/network check and record actual model,
      cost/data boundaries, outcomes, and limitations. Never print secrets.
- [ ] Prepare evaluation scenarios for authentic intent, tone, and user control.
      Record observations honestly; do not invent research measurements.
- [ ] Update the paper draft/evaluation preparation as called for by the plan.

## 4. Outstanding verification carried from the merged implementation

Sprint 4 was merged with these items explicitly open. They remain pending until
actually checked or their limits are explicitly accepted. Earlier passing results
are in the [Sprint 4 progress notes](../sprint-04/sprint-04-progress.md) and
[live report](../sprint-04/live-verification-2026-11-03.md).

### Backend and persistence

- [ ] Backend restart/persistence evidence for real messages and battery status.
- [ ] Raw collection validator/index/startup checks and backup evidence, including
      two startup checks for `callingin_dev` and `callingin_sprint03_verify`.
- [ ] Initial simultaneous room-creation race; the live concurrent test used an
      already-created room.
- [ ] Live 5,000-unit invitation acceptance boundary; 5,001 rejection and message
      boundaries were already checked in the recorded live batch.
- [ ] Shared-IP 100-request login ceiling, cross-IP email failures, and process-
      restart/reset behavior. Do not saturate active shared accounts/connections.

### Drafts and accessibility

- [ ] Natural idle expiry and Change person/lookup expiry recovery.
- [ ] Real OS clipboard selection/copying of retained drafts before explicit sign-in.
- [ ] Complete any remaining in-flight Cancel/navigation checks against real traffic;
      existing mocked regression results and live observations stay distinct.
- [ ] Human keyboard-only walkthrough: Tab, Shift+Tab, Enter, and Space through
      accounts, invitations, confirmation, pagination, conversations, and battery.
      Check visible focus, logical order, errors/expiry, and actual copying.
- [ ] VoiceOver, Safari, 200% zoom, and an actual phone. Existing axe/390px viewport
      checks do not complete these human/browser checks.
- [ ] Include the AI Coach controls in the human checks once implemented.

### Final records

- [ ] Check the merge commit `0017bbf` GitHub Quality result if it has not already
      been verified. The last check in this conversation saw it running; parent
      `61184fc` and `a8fd2a9` checks passed.
- [ ] Record any explicit acceptance or rescheduling of remaining evidence gaps.
      A merge is not a claim every manual check passed.

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
