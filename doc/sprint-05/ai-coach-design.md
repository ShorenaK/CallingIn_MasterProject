# Sprint 5 — AI Coach design proposal

**Prepared:** November 4, 2026 (America/New_York).

**Status:** Proposal for review. Shorena approved creating this document and,
on November 4, recording the follow-up testing, credit, and deployment discussion.
The initial document was separately committed/pushed as `4aebeab`. No application
implementation, provider, model, SDK, installation, deployment, or further Git
submission is approved by these documentation updates.

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

## November 4 — Plain-language explanation and low-cost sequence

Shorena's priority is to spend as little as possible while testing for class.
The following sequence is a recommendation, not implementation approval.

**Provider-specific** means details belonging to the selected AI company or
service: its API format, privacy terms, prices, models, and error responses.
OpenAI is one candidate; Amazon Bedrock is another. Neither is selected yet.

**Controlled provider doubles** are test substitutes for the external AI call.
For example, a backend test supplies a prepared suggestion, a delayed response,
or an error. This is like rehearsing a phone call before calling the real person.
Tests can check validation, retained drafts, timeouts, and helpful errors without
an API key or paid generation. They do not prove real model quality or actual
provider behavior. Browser tests may also mock CallingIn's API; those are a
separate test boundary from replacing the provider inside backend tests.

| Step | Proposed activity                                                                 | Spending and approval boundary                                                |
| ---- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Discuss and approve the user flow, privacy boundary, and limits                   | Design remains under discussion                                               |
| 2    | Compare current provider capabilities, costs, credits, and terms                  | Documentation research only; no purchase or live generation                   |
| 3    | Approve and build the backend handler with controlled provider doubles            | Local tests make no paid AI calls                                             |
| 4    | Approve and build editable UI suggestions and draft protection                    | Local/mocked integration; no automatic sending                                |
| 5    | Check credit eligibility and expiry; select a small live-test budget              | Claim eligible credits near the first real test, not merely to begin planning |
| 6    | Approve real provider integration and a small synthetic-data test from the laptop | Server-only credentials; inspect real output, errors, and usage               |
| 7    | Approve deployment preparation and then a public class demo                       | Hosting is separate from AI usage; deployment needs its own approval          |
| 8    | Record actual results, obtain independent review, and finish closeout             | Separate approval for fixes, Git submission, and merge                        |

The provider adapter and UI steps can be adjusted after design approval. A
public deployment is not required to call a real AI API from the local backend.

### ChatGPT account and when to claim credits

CallingIn cannot use a personal ChatGPT login or monthly chat allowance directly.
If OpenAI is selected, its backend would use an OpenAI API project credential.
The intended path is browser → CallingIn backend → OpenAI API. Never expose the
key in frontend code or commit it to Git.

The plan to check is Shorena's existing personal ChatGPT subscription: its exact
name, such as Plus or Pro. Her plan and eligibility have not been confirmed.
Official documentation consulted November 4 lists an API credit benefit for
eligible Pro and Business subscriptions; Plus is not listed for that benefit.
It requires activation, and credits expire with the applicable billing cycle.
Do not assume a paid chat subscription automatically funds API requests.

Recommendation: check eligibility and the renewal date now, then claim eligible
credits when ready for the first real API test. Recheck terms at that point.
Do not upgrade a subscription or buy credits just for the mocked development
stage. No credit application, activation, account inspection, or purchase was
performed in this discussion. See [OpenAI credit terms](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)
and [API authentication](https://developers.openai.com/api/reference/overview).

### Amazon alternatives

Amazon Bedrock could supply AI suggestions using an available Amazon Nova or
other supported model. Bedrock usage is priced by the selected model/service;
it is not automatically free. It can be called from a backend hosted on Render,
so choosing Bedrock would not require migrating all of CallingIn to AWS.

AWS's advertised new-customer offer at the time of discussion includes $100
initial credits and up to $200 total, with a Free Plan lasting up to six months.
Shorena's AWS account age, eligibility, selected model access, and credit coverage
are unverified. Check those details before relying on the offer. AWS Educate
provides free learning resources/labs without a credit card, but that alone does
not establish funding for CallingIn's deployment or Bedrock calls. Ask the
professor whether university project credits are available when Shorena supplies
her meeting questions. See [AWS Free Tier](https://aws.amazon.com/free/),
[Bedrock pricing](https://aws.amazon.com/bedrock/pricing/), and
[AWS Educate](https://aws.amazon.com/education/awseducate/).

Recommendation: use existing eligible credits first. Compare setup effort as
well as token prices; adding AWS solely for a small saving may not help this
semester's scope. No AWS resource or permission change is authorized.

### Render demo proposal and deployment preparation

Render is a proposed class-demo host, not a selected or configured deployment.
The simplest proposed arrangement is one Express web service serving the built
React frontend and `/api`, using the existing Atlas database if its tier and
access configuration are suitable. One browser origin simplifies the current
cookie and exact-origin protections. The inspected Vite `/api` proxy is for
development only; it does not provide production routing.

Before implementation, inspect and explain these deployment changes:

- Serve Vite's built assets from Express with correct API/static routing and
  safe missing-route handling. Preserve the frontend/backend source layout.
- Set the supported Node version, reproducible build/start commands, Render
  host/port binding, and health check. Avoid writing review builds into tracked
  dist files or silently deploying an unfinished branch.
- Configure the exact public HTTPS `APP_ORIGIN`, production mode, session secret,
  database connection, and eventually provider settings in host-managed secrets.
  Review Render proxy behavior before configuring narrowly scoped proxy trust
  so secure session cookies work; do not enable blind proxy trust or broad CORS.
- Review Atlas network access for the chosen Render region and preserve existing
  database validators/indexes and test data. Confirm the actual database tier;
  its current cost was not checked.
- Decide which branch/commit may deploy and whether automatic deployment is
  appropriate. Deploying does not authorize a merge or branch change.
- Protect live AI usage with the approved quotas/budget and generation-off
  control. Render sleeping/restarting resets process-local counters; those
  counters alone cannot enforce a durable spending limit.
- Verify deployed login/logout, cookies, invitations, messages, battery, and
  approved AI behavior, including expiry and cold starts. Carry forward unfinished
  human/database checks rather than declaring them passed by deployment.

Render documentation checked November 4 describes free web services with 750
workspace instance hours per month. They sleep after 15 idle minutes and take
about a minute to wake. Bandwidth/build allowances also apply; without a payment
method, the documented over-limit behavior is suspension or blocked builds
rather than supplementary usage charges. High service-initiated external traffic
can also trigger suspension. Recheck terms before deploying. Use the provided
Render address initially rather than buying a domain. See [Render free limits](https://render.com/docs/free)
and [web service setup](https://render.com/docs/web-services).

Hosting, database, and AI usage are separate costs. Free Render hosting does not
make OpenAI or Bedrock requests free. Local development with doubles requires no
new hosting purchase or paid AI calls; no claim is made about existing account
charges. Open the demo before class to allow a sleeping service to wake.

### Next discussion

Continue reviewing the design and gather Shorena's professor questions. No
additional questions or advisor answers have been invented or added to the
meeting agenda. All provider/hosting recommendations above remain proposals.
