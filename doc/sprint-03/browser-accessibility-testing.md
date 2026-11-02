# Browser and accessibility checks

**Setup date:** October 30, 2026 (America/New_York)

Playwright drives a real Chromium test browser, like a person opening the page,
typing, and pressing buttons. `@axe-core/playwright` scans the displayed page for
common accessibility problems. This setup was explicitly approved, superseding
the earlier tooling deferral; it does not record professor endorsement.

## Run locally

Root development dependencies include `@playwright/test` and
`@axe-core/playwright`. After the repository's normal dependency installation,
download the test browser once (or again after a Playwright browser revision changes):

```bash
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
npm run test:e2e
```

The browser download lives in ignored `node_modules`, not your normal browser.
Repeat the download after a clean installation removes that project-local folder.
The suite starts its own Vite server on `127.0.0.1:4175` in `e2e` mode. It refuses
to reuse an existing server, so stop anything else on that port before running.
Your regular frontend on port 5173 and backend on 3001 are not required.
All `/api/` requests are intercepted with explicit test responses; unexpected
API calls fail instead of reaching the backend proxy. Never use real credentials
in these tests. Vite uses its normal configuration loading; keep secrets out of
any `VITE_*` variables because those are exposed to frontend code.

## Current checks

- Sign-in and registration show labeled fields and the four password rules.
- The password field points to its guidance for assistive technology.
- Keyboard Tab moves through account fields and a focus outline is present.
- Too-short, space-containing, and email-containing new passwords are blocked.
- Mock sign-in displays the profile; sign-out returns to the sign-in screen.
- Password Show/Hide preserves entered text; overlong registration passwords
  remain intact and are rejected instead of silently shortened.
- Invitation lists show counterpart names, messages, text/shape status labels,
  loading/empty/error states, and malformed-date feedback.
- Show more appends pages, announces results, moves focus, and handles retries
  and expired sessions; stale pagination replies cannot replace a newer reload.
- Recipient choices cover Maybe Later, final-choice confirmations, Go back,
  accepted/declined states, conflicts, and session expiry.
- Sending covers exact-email lookup, missing/rate-limited accounts, message
  validation, the 5,000-code-unit counter, duplicate feedback, and session expiry.
- Cancel/Discard clears unsent drafts only after confirming written text;
  Keep writing preserves it. Keyboard focus follows each action, and cancellation
  is disabled during an active send.
- A draft retained by Change person remains available to copy if lookup discovers
  an expired session; sign-in is an explicit action after the warning.
- axe scans tested sign-in, registration, profile, and invitation views for WCAG 2 A/AA,
  WCAG 2.1 A/AA, and WCAG 2.2 AA tagged rules supported by the installed engine.

These are browser UI tests with simulated APIs, not real login/session/Atlas
integration tests. Backend tests and the separately recorded live Atlas checks
cover different boundaries. Provider login is not implemented. Passing mocked
invitation tests does not establish live database, cookie, or server behavior.

## Reports and failures

Playwright prints results and writes a local HTML report. Open it with:

```bash
npm run test:e2e:report
```

`playwright-report/` and `test-results/` are ignored by Git and formatting. Failed
runs retain local traces. Do not commit traces or recordings containing private
data. A failed axe assertion lists rule violations; fix the actual problem after
explaining and approving the app change. Do not suppress rules or exclude UI just
to make a check green. This initial setup uses no axe exclusions.

## CI and future frontend work

The existing Quality workflow installs Chromium and required Linux browser
libraries, then runs `npm run test:e2e`. This adds browser download/runtime cost.
It uses mocked APIs and needs no Atlas secrets. No hosted workflow result is
implied by local success. These checks run separately from backend `npm test`;
`npm run check` is not silently expanded to include browser downloads.

Extend the existing invitation tests when approved behavior changes. Obtain
approval for new app edits; keep implementation and independent review distinct.
Only one agent edits a given task at a time. See the latest dated
[Sprint 3 progress notes](sprint-03-progress.md) for measured run results and
remaining live/manual checks.

Automated scans and an outline check do not certify accessibility. Manual keyboard
navigation, visible focus/contrast, zoom/reflow, screen-reader use, and usability
checks remain necessary. Chromium alone does not establish Safari/Firefox behavior.

## Official references

- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [Playwright web server setup](https://playwright.dev/docs/test-webserver)
- [Playwright browser installation](https://playwright.dev/docs/browsers)
