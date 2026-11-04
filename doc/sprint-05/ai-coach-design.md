# Sprint 5 — AI Coach design proposal

**Prepared:** November 4, 2026 (America/New_York).

**Status:** Proposal for review. Shorena approved creating this document only.
No application implementation, provider, model, SDK, installation, network check,
or Git submission is approved by this document.

Related: [Sprint 5 plan](sprint-5.md) and [progress](sprint-05-progress.md).

## Purpose and first scope

Help a signed-in user draft or refine an invitation while keeping their intent
and control. Think of the Coach as a writing assistant: it suggests wording;
the user decides what belongs in the letter and when to send it.

Start with invitation composition after the existing recipient lookup. Propose
two actions: draft from a short description of what the user wants to say, or
refine the current invitation text. Initial tone choices: natural, warm, and
direct. These choices and labels need approval before implementation.

Conversation replies, automatic sending, relationship diagnosis, recipient
profiling, message-history analysis, and payment features are outside this first
scope. The Coach should preserve intent without inventing facts, promises, or
claims about the recipient's feelings. Generated wording still needs human review.

## Current source foundation

- `frontend/src/invitations/SendInvitation.jsx` renders lookup, composition,
  message length feedback, Send invitation, and discard confirmation.
- `frontend/src/invitations/useSendInvitation.js` owns the page-memory draft,
  lookup, explicit sending, and expiry/error recovery.
- `frontend/src/invitations/api.js` calls the existing authenticated APIs and
  checks response shapes. Invitation text uses a trimmed 5,000 UTF-16-unit limit.
- `backend/src/app.js` mounts exact-origin/JSON protection, a 16 KB JSON parser,
  session middleware, account guards, and operation-specific limits.
- `backend/src/request-protection.js`, `require-account.js`, and
  `safe-logging.js` provide existing security patterns to reuse deliberately.

There is no AI dependency or endpoint in the inspected application. A new route
prefix must explicitly join both request protection and authenticated middleware;
placing a handler in `app.js` alone would not provide those protections.

## Proposed user flow and draft protection

1. The user finds a recipient using the existing flow, then optionally opens
   AI assistance. Ordinary writing and sending remain available.
2. For drafting, the user enters their intent separately. For refinement, the
   Coach uses the current message. A visible explanation identifies the chosen
   provider and exactly which text will leave CallingIn before generation.
3. An explicit Generate suggestion action submits one request. Generation never
   submits the invitation form. Generation controls use `type="button"`.
4. Show the result in a separate, editable suggestion field. The existing message
   stays unchanged. Keep original dismisses the suggestion; Use suggestion copies
   it into the invitation only after an explicit action.
5. If the original message changed since generation began, confirm replacement
   before applying the suggestion. Keep a page-memory previous version with an
   explicit restore action; confirm restoration if it would overwrite later edits.
6. The user reviews the final invitation and separately chooses Send invitation.

Keep intent, original text, and suggestions in page memory, never localStorage or
sessionStorage. Reloading or leaving the page can lose them, as with today's
draft. Extend discard protection to all written Coach fields, including when the
invitation message is empty. Preserve copyable text on session expiry and require
explicit sign-in. Changing recipient invalidates the pending result and dismisses
the suggestion; confirm before discarding written Coach content.

Use a separate generation state rather than the existing invitation-send `busy`
flag. Permit writing while generating, but prevent sending until generation ends
or is canceled. Cancel generation retains text. Navigation, recipient changes,
new requests, and successful sending must invalidate old results. Abort requests
where possible and also check request identity before updating state; cancellation
does not guarantee the provider stopped work or avoided a charge.

Announce generating, completion, and failures without moving focus unexpectedly.
Keep the generating control focusable with guarded `aria-disabled` behavior.
Applying a suggestion focuses the invitation field. All actions need visible
labels, keyboard access, and human accessibility verification.

## Proposed API contract

`POST /api/ai-coach/suggestions`, behind origin/JSON, session, account, and
AI-specific request limits. This is a proposed route, not an existing API.

Request fields:

| Field    | Proposed values and meaning                                   |
| -------- | ------------------------------------------------------------- |
| `action` | `draft` or `refine`                                           |
| `text`   | Intent for drafting, or the current invitation for refinement |
| `tone`   | `natural`, `warm`, or `direct`                                |

Reject unknown fields, invalid types, unsupported choices, invisible-only input,
and input exceeding 5,000 trimmed UTF-16 units. The existing 16 KB body limit
remains independent; some valid-length Unicode input may exceed that byte limit.
Do not accept recipient IDs, sender IDs, email addresses, or history fields as
structured context. Authentication identifies the caller server-side.

Return `200` with `{ "suggestion": "editable plain text" }` only after server-side
validation. Require visible, nonempty text within the invitation's 5,000-unit
limit and a bounded provider response size. Reject invalid output rather than
silently truncating it. Render as text in a textarea, never HTML. Both backend
and frontend validate the response shape. Return `Cache-Control: no-store`.

Proposed failure responses:

| Status        | Meaning and user recovery                                                             |
| ------------- | ------------------------------------------------------------------------------------- |
| `400`         | Invalid request; explain what to correct                                              |
| `401`         | Session expired; preserve text and offer explicit sign-in                             |
| `403` / `415` | Existing origin or content-type protection rejects the request                        |
| `413`         | JSON body exceeds the existing limit                                                  |
| `422`         | Provider declines assistance; allow manual writing without exposing raw provider text |
| `429`         | CallingIn request allowance reached; include a safe retry delay                       |
| `502`         | Empty, malformed, oversized, or otherwise invalid provider output                     |
| `503`         | Coach unavailable, unconfigured, or provider capacity/budget unavailable              |
| `504`         | Provider timed out; retain text and let the user choose whether to retry              |

Provider-specific status mapping needs confirmation after selection. Never
forward raw provider errors, account details, or credentials to the browser.

## Privacy and provider boundary

Send only the submitted text, selected action/tone, and fixed writing instructions
from the backend. Do not automatically attach names, emails, account records,
Social Battery, invitation history, or private conversation messages. User-entered
text can itself contain personal information; disclose that clearly.

Proposed explanation, to finalize after provider selection:

> When you generate a suggestion, your entered text and selected tone are sent
> to [chosen provider]. Review the suggestion before using it. Nothing is sent
> to the other person until you choose Send invitation.

Link an accurate provider-specific retention/training explanation before launch.
Do not promise zero retention or no training without verifying the chosen
service, account settings, and terms. No CallingIn database collection for AI
prompts or suggestions is proposed. An applied suggestion becomes an ordinary
stored invitation only when the user sends it.

Keep credentials and model configuration on the backend. Treat submitted text as
untrusted content inside fixed instructions. Give the model no tools, database
access, browsing, or ability to send invitations. Prompt instructions alone do
not guarantee truthful or suitable wording; evaluation and user review remain
necessary.

## Proposed reliability and cost controls

Starting values for discussion, not approved configuration:

- One in-flight generation per account; five attempts per account per minute
  and twenty per account per day. Count dispatched failures too, since they may
  incur cost. Check allowances before calling the provider.
- A 20-second backend deadline with cancellation, bounded output tokens and
  response bytes, and no automatic retries. Exact output limits depend on the
  chosen model and must support the agreed message length.
- A configurable application-wide daily allowance and provider-side spending
  controls where available. Agree on a dollar budget before live use. Request
  counts alone do not enforce a dollar ceiling.
- Disable generation safely if required configuration is absent or the budget
  is exhausted; ordinary invitation composition remains usable.

Existing process-local rate limits reset on restart and do not coordinate across
servers. They are insufficient for a durable daily AI spending allowance. Before
live integration, agree on persistent atomic reservations and provider controls
for the intended deployment. Any new MongoDB quota collection, indexes, retention,
and failure accounting need a separate design and approval. Do not add Redis or
another service by default.

Log only allowlisted operation/outcome categories, elapsed time, and validated
numeric usage if needed. Do not log prompts, suggestions, request bodies, raw
provider errors, headers, tokens, or secrets. Avoid passing SDK errors directly
to existing logging. The implementation should use a small provider boundary
that tests can replace; SDK versus server-side HTTP remains undecided.

## Future implementation locations

| Location                                                                | Intended responsibility, subject to implementation approval           |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `frontend/src/invitations/SendInvitation.jsx`                           | Coach entry and composition integration                               |
| `frontend/src/invitations/useSendInvitation.js`                         | Explicit application of suggestions and draft lifecycle coordination  |
| New focused Coach component, hook, and API module under `frontend/src/` | Generation state, separate editable suggestion, response validation   |
| `backend/src/app.js`                                                    | Protected/authenticated route mounting                                |
| New focused backend handler, validation, provider, and quota modules    | Input/output checks, external call boundary, limits and safe failures |
| `backend/src/server.js` and startup wiring as needed                    | Validated server-only configuration and dependency injection          |
| `backend/test/` and `frontend/e2e/`                                     | Meaningful API and browser regressions                                |

No database schema change is needed for draft text itself. Any durable quota
storage is a separate approval item. Preserve the existing frontend/backend
layout and JavaScript/checkJs conventions.

## Verification and evaluation proposal

Use controlled provider doubles first. Test authentication and origin/JSON
protection, unknown fields, Unicode/body boundaries, output validation, refusal,
timeouts, quota concurrency, safe logs, and absence of database/message side
effects. Assert that failures before dispatch never call the provider.

Browser tests should prove explicit generation, editable suggestions, original
preservation, replacement confirmation, restore behavior, no auto-send,
cancel/retry, expiry, recipient changes, edits during generation, late results,
focus, and keyboard operation. Run existing relevant regressions after integration.
Mocked tests establish application behavior, not model quality.

For separately approved live evaluation, use synthetic examples first: reconnecting
with a friend, a brief invitation, respecting personal space, multilingual text,
ambiguous intent, and input asking the model to invent facts. Record actual model
and settings, observed cost, intent preservation, tone, invented details, and
whether users can easily keep or edit their own words. Do not invent scores or
research conclusions. Complete human accessibility checks for the new controls.

## Recommendation and next approval

Review this flow and data boundary first. Then authorize a bounded comparison of
providers using current official documentation for capability, privacy, cost,
and configuration. That research requires separate network approval and should
not include live generation or account purchases.

After selecting a provider and agreeing on limits, explain and approve the first
backend implementation step. A tested handler/provider boundary should precede
UI integration. No production endpoint should return a pretend AI suggestion.
