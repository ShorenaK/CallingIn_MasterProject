# Sprint 02 Progress — Accounts and Authentication

**Actual start:** October 13, 2026  
**Branch:** `sprint-02-authentication`  
**Starting commit:** `dc21195` on `main`  
**Status:** Atlas connection verified; backend registration implemented and tested
with simulated storage. Further implementation awaits professor feedback.

## Goal

Add MongoDB-backed accounts, registration, login, logout, profiles, and
protected endpoints to the existing React and Express application.

The original semester plan targeted October 15. This record uses
the actual start date; revised milestones and advisor review remain to be agreed.

## Working agreement

- Explain **WHAT, WHY, and HOW** before each new group of changes.
- Ask permission and wait before implementation, installations, or submissions.
- The student handles staging, commits, pushes, and merges.
- Keep JavaScript, React/Vite, Node.js/Express, and MongoDB as the planned stack.
- Keep credentials out of tracked files and document safe environment examples.

## Proposed sequence — approval required before implementation

1. Review the existing code and agree on account fields and authentication behavior.
2. Select local MongoDB or a hosted database and agree on connection setup.
3. Agree on authentication/session design and dependencies before installation.
4. Implement database connection and account storage with failure handling.
5. Implement registration and login with validation and secure password storage.
6. Implement logout, protected endpoints, and profile viewing/updating.
7. Add the corresponding frontend forms and authenticated application state.
8. Test success, invalid input, duplicate accounts, wrong credentials,
   unauthorized requests, logout, and database failure behavior.
9. Run project checks, dependency audits, and browser verification.
10. Update records, then let the student review, commit, push, and merge.

## Decisions still needed

- Review new professor feedback and revise priorities.
- Profile fields beyond the approved registration display name, email, and password.
- Session persistence and logout behavior.
- Validation rules, error messages, and frontend layout.
- Test database setup that stays separate from real user data.

## Progress

- [x] Create Sprint 02 branch from clean main.
- [x] Create planning checklist and AI development log.
- [x] Select Atlas and install the MongoDB driver.
- [x] Verify live database connection and ping.
- [x] Implement backend registration and salted password hashing.
- [x] Run registration tests using simulated storage.
- [ ] Verify registration and unique-email enforcement against a test database.
- [ ] Review professor feedback and approve the next implementation step.
- [ ] Agree on sessions and implement login, logout, and protected endpoints.
- [ ] Implement frontend account flows.
- [ ] Complete relevant tests and browser verification.
- [ ] Student reviews, stages, commits, pushes, and merges completed work.

## Documentation organization

New Sprint 02 records belong in `doc/sprint-02/`. This branch currently inherits
shared records and Sprint 01 documentation from main. No inherited documents
were removed during this setup. Any change to that layout requires a separate
approved step and a plan to preserve main's shared records during integration.

## Verification

The full project check passed after registration: lint, formatting, 13 backend
tests, and frontend build. Live Atlas ping passed; registration tests used
simulated storage. Browser account flows and live account creation remain
unverified. No registration records were written to Atlas during testing.

## Records

- [Sprint 02 AI development log](ai-development-log-2.md)
- [Sprint 02 commands and step record](commands_sprint-02.md)
- [Daily commands](../daily-commands.md)
- [Semester sprint plan](../sprint-plan.md)

## Quality follow-up — October 16, 2026

- Shared test-server helper removes repeated health/registration test setup.
- Coverage command added: `npm run test:coverage` from the root or backend.
- All 20 backend tests pass, including seven additional failure/error cases.
- Coverage includes all four source files: 81.22% lines, 98.15% branches,
  84.21% functions. Server lifecycle paths remain the largest gap.
- Coverage thresholds, type checking, Node.js lint plugin, and GitHub CI remain
  separate pending steps. The accessibility plugin remains compatibility-blocked.

## Server lifecycle follow-up — October 16, 2026

Startup/shutdown logic is independently testable in `backend/src/lifecycle.js`.
Ten additional tests cover startup success/failure, index failures, port conflicts,
shutdown signals, repeated cleanup, and timeout behavior. All 30 tests pass;
coverage reports 100% lines, branches, and functions across the five backend
source files. Earlier coverage numbers above are retained as historical baselines.
Live Atlas account creation, browser account flows, and coverage thresholds
remain unverified or not implemented.

## Accessibility testing — awaiting professor discussion

**Decision recorded:** October 16, 2026

I am deferring accessibility-tool installation until I discuss the options with
Professor Lionelle. No Playwright/axe packages, browser downloads, accessibility
test configuration, or `test:a11y` command were added.

The originally suggested `eslint-plugin-jsx-a11y` 6.10.2 declares support only
through ESLint 9; this project keeps ESLint 10 because ESLint 9 is end-of-life.
Accessibility linting is therefore not enabled.

### Proposed automated alternative

Playwright and axe-core are free, open-source tools. For the proposed browser
accessibility tests, both packages work together:

- `@playwright/test` opens the browser, runs tests, and reports results.
- `@axe-core/playwright` integrates axe-core accessibility scans into those tests.
- Playwright also needs a test-browser download, initially Chromium.

Setup would require root development dependencies/lockfile changes, browser
installation, configuration and test files, a proposed `npm run test:a11y`
command, and generated-report exclusions. Tests would start Vite automatically
and simulate backend health responses, without Atlas credentials. Any findings
would be reviewed before approving application changes.

This approach checks the rendered page independently of ESLint and could later
run in CI. It adds test maintenance as the interface changes. Automated scans
cannot prove complete accessibility; manual keyboard, focus, zoom, and
screen-reader checks remain necessary.

### Simpler manual alternative

The free axe DevTools browser extension can scan the running application
without adding project packages. It would not, by itself, provide a repeatable
command-line or GitHub CI gate.

### Questions for Professor Lionelle

- Should I use Playwright with axe-core now, or begin with manual browser scans?
- Is rendered-page testing an acceptable interim approach while the suggested
  ESLint plugin does not declare support for the installed ESLint version?
- Which pages/states, accessibility criteria, and manual checks should we prioritize?

References: [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing),
[Playwright browser setup](https://playwright.dev/docs/browsers), and
[axe DevTools extension](https://www.deque.com/axe/devtools/extension/).
