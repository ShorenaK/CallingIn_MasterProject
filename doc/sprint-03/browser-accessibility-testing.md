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
- axe scans full sign-in, registration, and profile views for WCAG 2 A/AA,
  WCAG 2.1 A/AA, and WCAG 2.2 AA tagged rules supported by the installed engine.

These are browser UI tests with simulated APIs, not real login/session/Atlas
integration tests. Backend tests and the separately recorded live Atlas checks
cover different boundaries. The setup does not add invitation UI or provider login.

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

Claude should extend these tests as invitation screens are implemented: lookup,
creation, incoming/outgoing lists, all responses, pending/error states, and keyboard
operation. Obtain approval for new app edits; Codex independently reviews Claude's
implementation. Only one agent edits a given task at a time.

Automated scans and an outline check do not certify accessibility. Manual keyboard
navigation, visible focus/contrast, zoom/reflow, screen-reader use, and usability
checks remain necessary. Chromium alone does not establish Safari/Firefox behavior.

## Official references

- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [Playwright web server setup](https://playwright.dev/docs/test-webserver)
- [Playwright browser installation](https://playwright.dev/docs/browsers)
