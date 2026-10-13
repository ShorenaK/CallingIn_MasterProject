# Sprint 02 Progress — Accounts and Authentication

**Actual start:** October 13, 2026  
**Branch:** `sprint-02-authentication`  
**Starting commit:** `dc21195` on `main`  
**Status:** Planning only; authentication and database integration not implemented.

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

- Database environment: local MongoDB or hosted service.
- Required registration and profile fields.
- Session persistence and logout behavior.
- Validation rules, error messages, and frontend layout.
- Test database setup that stays separate from real user data.

## Progress

- [x] Create Sprint 02 branch from clean main.
- [x] Create planning checklist and AI development log.
- [ ] Approve database and authentication design.
- [ ] Implement database and account endpoints.
- [ ] Implement frontend account flows.
- [ ] Complete relevant tests and browser verification.
- [ ] Student reviews, stages, commits, pushes, and merges completed work.

## Documentation organization

New Sprint 02 records belong in `doc/sprint-02/`. This branch currently inherits
shared records and Sprint 01 documentation from main. No inherited documents
were removed during this setup. Any change to that layout requires a separate
approved step and a plan to preserve main's shared records during integration.

## Verification

This setup changes documentation only. Formatting and whitespace will be checked;
no new application behavior or authentication test result is claimed here.

## Records

- [Sprint 02 AI development log](ai-development-log-2.md)
- [Daily commands](../daily-commands.md)
- [Semester sprint plan](../sprint-plan.md)
