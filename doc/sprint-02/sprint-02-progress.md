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
