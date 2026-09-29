# CallingIn — Fall 2026 Sprint Plan

**Course:** CS 8674 – Project Course  
**Student:** Shorena K. Anzhilov  
**Advisor:** Professor Albert Lionelle  
**First meeting:** September 15, 2026  
**Target finish:** Approximately December 11, 2026

## Project Scope

The semester MVP focuses on AI-assisted communication:

- Registration, login, logout, and profiles.
- AI-assisted message drafting and refinement.
- Conversation invitations and recipient responses.
- Private one-to-one messaging after acceptance.
- Basic Social Battery availability.

### Future Improvements

Trusted Circle — human support without AI — is outside the
semester MVP because of the available development time.

## Proposed Technology Stack

- Frontend: React with JavaScript.
- Backend: Node.js and Express.
- Database: MongoDB.
- AI: An API accessed through the backend.

## Sprint Schedule

These are planned targets, not a record of completed work.
Meeting dates may change.

| Sprint            | Dates         | Planned deliverables                                                                                                                            | Advisor review |
| ----------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1 — Foundation    | Sep 15–28     | Updated scope, meeting notes, sprint plan, initial wireframe, React and Express starters, welcome page, health endpoint, initial quality checks | Sep 29         |
| 2 — Accounts      | Sep 29–Oct 12 | Remaining foundation work, MongoDB connection, registration, login, logout, profiles, protected endpoints, authentication tests                 | Oct 13         |
| 3 — Invitations   | Oct 13–26     | User lookup, invitation creation, incoming and outgoing lists, response handling, access checks, tests                                          | Oct 27         |
| 4 — Conversations | Oct 27–Nov 9  | Private messaging, participant-only access, basic Social Battery, invitation-to-conversation tests                                              | Nov 10         |
| 5 — AI Coach      | Nov 10–23     | AI drafting, editable suggestions, tone refinement, failure handling, integrated MVP                                                            | Nov 24         |
| 6 — Evaluation    | Nov 24–Dec 7  | Evaluation, bug fixes, final checks, setup documentation, report and presentation drafts                                                        | Dec 8          |
| Final preparation | Dec 8–11      | Advisor feedback, final corrections, demonstration, and submissions according to confirmed deadlines                                            | As needed      |

### Planning Update — September 28

Record Sprint 1's actual completion status at its review.
Move unfinished foundation tasks into Sprint 2 and adjust
later targets if needed.

## Research and Writing

- Sprints 1–2: Literature review, problem statement, research question.
- Sprints 3–4: Design, implementation notes, and evaluation plan.
- Sprint 5: Updated paper draft and evaluation preparation.
- Sprint 6: Findings, limitations, conclusion, presentation, and reflection.

Confirm final submission dates with the advisor.
The proposal specifies the reflection is due the Friday before finals week.

## Development Workflow

- Use a separate branch for each sprint.
- Sprint 1 branch: `sprint-01-planning`.
- Sprint 1 includes documentation and starter code.
- Commit small, understandable changes.
- Review completed work in a pull request.
- Merge into `main` after relevant checks pass.

## Code Quality

Configure these practices during development:

- ESLint for linting and complexity checks.
- Prettier for formatting.
- Fast pre-commit checks.
- Automated tests for important behavior and failure paths.
- Dependency checks using npm audit or another selected tool.

Exact hook and testing tools remain to be selected.

## Sprint Branches

| Sprint | Branch                     |
| ------ | -------------------------- |
| 1      | `sprint-01-planning`       |
| 2      | `sprint-02-authentication` |
| 3      | `sprint-03-invitations`    |
| 4      | `sprint-04-conversations`  |
| 5      | `sprint-05-ai-coach`       |
| 6      | `sprint-06-evaluation`     |

Create each branch when its sprint begins, from the updated main branch.

## Sprint Completion Checklist

- [ ] Planned functionality can be demonstrated.
- [ ] Relevant checks and tests pass.
- [ ] Documentation and progress notes are updated.
- [ ] Changes are reviewed and merged into main.
- [ ] Unfinished work is recorded and rescheduled.
