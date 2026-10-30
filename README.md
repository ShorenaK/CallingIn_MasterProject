# CallingIn

### Helping people begin the conversations that matter most

CallingIn is my Fall 2026 project for **CS 8674 – Project Course**
in the **M.S. in Computer Science (ALIGN)** program.

- **Student:** Shorena K. Anzhilov
- **Faculty Advisor:** Professor Albert Lionelle
- **Project period:** September–December 2026
- **Status:** Planning and initial development

## Overview

Starting a conversation can be harder than sending a message.

Someone may want to reconnect with a friend, express appreciation,
offer an apology, or discuss something difficult but feel unsure
how to begin.

CallingIn explores how generative AI can help people find the words
while preserving their own voice and intentions. Users explain what
they want to express, review an AI-assisted draft, and send a
conversation invitation. The recipient chooses whether they are
ready to connect.

The Fall 2026 MVP focuses on this AI-assisted communication pathway.

## Mission

CallingIn's mission is to make meaningful communication easier by helping people begin conversations they might otherwise avoid, strengthen meaningful relationships, and remind us that human beings were never designed to heal in isolation.

The application is built on the belief that **we were never meant to carry every burden alone**. We spend so much time trying to regulate ourselves in isolation, yet humans have always found stability, strength, and comfort through other people. Sometimes, the strongest person is the one who knows when to lean on the people who love them and know them well.

Human connection is not only emotional but also biological. Research on **co-regulation** explores how people influence one another's emotional and physiological states. Spending time with people we feel safe around can help regulate stress responses, including changes in physiological processes involving cortisol and oxytocin. Our nervous systems can influence one another, helping us find calm, reassurance, and a sense of safety through supportive relationships.

CallingIn brings this understanding into its two complementary approaches:

### AI-Assisted Communication — Finding the Words

Sometimes, beginning a meaningful conversation is the hardest part. CallingIn uses generative AI to help individuals express their thoughts, feelings, and intentions while preserving their authentic inner voice. AI provides suggestions, but users remain in control of their words, decisions, and relationships.

### Trusted Circle — Finding the People

Human beings were not meant to navigate every challenge alone. Trusted Circle, a planned future feature, is designed around the importance of having people we trust, who know us well, and with whom we feel safe.

It creates opportunities for people to lean on one another, share their experiences, offer encouragement, and support each other through difficult moments. This feature emphasizes **human support without AI**, recognizing that meaningful connection comes from genuine presence, understanding, and care.

Sometimes, the fastest way to feel better isn't finding the right answers; it's finding the right person to sit beside you while you're still figuring it out.

CallingIn also recognizes that past experiences and survival patterns can influence how people approach relationships and difficult conversations. By making communication easier and encouraging supportive connections, the application aims to help people approach these moments with greater awareness, authenticity, and personal choice.

At its heart, **CallingIn is about helping people find both the words to begin a conversation and the human connections that make those conversations meaningful.**

The application remains grounded in thoughtful expression, privacy, individual boundaries, and the freedom to choose when and how to connect.

## Research Question

> How can Generative AI assist individuals in initiating meaningful
> interpersonal conversations while preserving authenticity and
> emotional intent?

The project combines software development with research on
AI-assisted communication, human-computer interaction, and
responsible design.

## Semester MVP

### 1. Accounts and Profiles

Users will be able to register, sign in, sign out, and maintain
a basic profile.

Password policy updated October 30, 2026: new passwords must contain **8–18
characters** and must not contain the account's full email address (case-insensitive).
Spaces, tabs, and other whitespace are not allowed in new passwords; a
letter/number combination is not required. The email, whitespace, and 18-character maximum rules apply at registration;
existing accounts can still sign in with their original passwords (up to 128 characters). The reduced
minimum is a user-approved usability tradeoff; it is below current NIST guidance
for password-only sign-in.

### 2. AI Communication Coach

Users will explain why they want to reach out and request help
drafting a message.

The coach will support:

- Drafting a message from the user's stated intent.
- Refining wording for clarity.
- Adjusting tone.
- Reviewing and editing suggestions before sending.

AI will not send messages on the user's behalf.

### 3. Conversation Invitations

A user will choose a recipient, prepare a message, and send an
invitation to connect.

The planned responses are:

| Response          | Behavior                                               |
| ----------------- | ------------------------------------------------------ |
| Accept            | Opens a private conversation                           |
| Maybe Later       | Keeps the invitation available for later consideration |
| I need some space | Closes the invitation without opening a conversation   |

The final wording will be reviewed during interface design.
Choosing not to connect does not create an obligation to respond later.

### 4. Private One-to-One Messaging

After an invitation is accepted, the two participants will be able
to exchange text messages in a private conversation.

Access will be restricted to the participants through server-side
permission checks.

### 5. Social Battery

Users will be able to share their communication availability:

- Open to conversations.
- Busy.
- Taking personal space.

Social Battery describes availability for contact, not a diagnosis
or an automatic assessment of someone's emotions.

## Example User Journey

1. Sign in to CallingIn.
2. Choose someone to contact.
3. Explain the reason for reaching out.
4. Request an AI-assisted draft.
5. Review and edit the message.
6. Send a conversation invitation.
7. The recipient chooses how to respond.
8. If accepted, begin a private text conversation.

### Example

**User's intent:**

> We haven't talked in a while, and I miss our friendship.

**Possible AI suggestion:**

> I've been thinking about you and would love to catch up
> if you're open to it.

The user can change the suggestion or write their own message
before sending it.

## Scope and Boundaries

The semester MVP will not include:

- Trusted Circle membership or shared mood updates.
- Gratitude List and Life Reflections.
- In-app voice or video calls.
- Group messaging or public social feeds.
- Automatic mood detection.
- Paid subscriptions or premium billing.
- Typing indicators or read receipts.
- AI-generated conversation summaries.

Real-time messaging and end-to-end encryption are not promised
for the initial version.

CallingIn is a communication project. It is not intended to diagnose
or treat mental health conditions or replace professional care.

## Future Improvements

The following features are possibilities for later development and are
outside the Fall 2026 MVP.

**Google sign-in** is planned future work, outside the current invitation sprint
and the committed Fall 2026 MVP. It is not implemented. It will need provider setup,
secure account linking, and separate design, approval, and testing.

The planned evolution of CallingIn is:

1. **Phase 1 — AI Communication Coach:** Help users prepare messages and begin
   conversations through the semester MVP.
2. **Phase 2 — Trusted Circle:** Add a private circle of trusted friends and family.
3. **Phase 3 — Seeing Yourself Through Others’ Eyes:** Let users request a trusted
   friend's perspective on their strengths, positive qualities, and skills.
4. **Phase 4 — Gratitude List:** Add a personal list of people who positively
   influenced the user's life.
5. **Phase 5 — Life Reflections:** Add a personal space for thoughts, observations,
   and lessons learned.

These phases describe the intended progression, without committed delivery dates.
Multilingual support and other enhancements remain future possibilities outside
this numbered sequence.

### Trusted Circle — Human Support Without AI

A future version may introduce a private, invitation-only circle
of trusted friends and family.

Users could voluntarily share personal experiences, how they feel,
and what kind of contact they welcome. Someone in their circle could
then offer encouragement or invite them to talk using their own words,
without AI involvement.

The idea is grounded in humans supporting humans while respecting
each person's privacy, availability, and boundaries.

### Seeing Yourself Through Others’ Eyes

A future feature could let users request a personal list of strengths, positive
qualities, and skills that a trusted friend sees in them.

For example, User A could ask User B, a member of their Trusted Circle: “What
positive qualities or skills do you see in me?” User B could choose to respond
with a list in their own words, helping User A understand themselves through
someone they trust.

Participation would be voluntary, and responses would be private between the two
users by default.

### Gratitude List

A personal list of people who positively influenced the user's life,
believed in them, gave them opportunities, or helped change their
life's direction.

Users would be able to:

- Add, edit, and remove names.
- Keep their Gratitude List private by default.
- Optionally share the list with their Trusted Circle.

### Life Reflections

A personal space for preserving philosophical thoughts, observations,
questions, and realizations about life.

Topics might include:

- The meaning of life and happiness.
- Personal growth and lessons learned.
- Relationships, kindness, and human connection.
- Experiences that changed the user's perspective.
- Original philosophical thoughts the user wants to remember.

Users would be able to:

- Create, edit, and save personal reflections.
- Keep reflections private by default.
- Optionally share selected reflections with their Trusted Circle.
- Choose what to share and with whom.
- Edit or remove previously shared reflections.

Life Reflections would focus on authentic human expression.
AI assistance would not be required.

### Multilingual Interface and Message Translation

A future version could support people in different countries and people who
prefer to communicate in languages other than English.

- **Interface languages:** Let users choose a preferred language for navigation,
  buttons, forms, instructions, and other application text.
- **Message translation:** Let users request a translation of a sentence or
  message into a selected language, helping people communicate across languages.
- **Original text and user control:** Keep the original message available, label
  translated text, and let users review a translation before choosing to send it.

Supported languages and translation tools would be evaluated in future planning.
These capabilities are proposed future work, not current functionality or
Sprint 02 commitments.

### Other Possible Enhancements

- Real-time message delivery.
- Typing indicators and read receipts.
- Additional AI communication styles.
- Native mobile applications.
- Enhanced privacy features.
- End-to-end encryption.
- A future premium offering.

These are possibilities for later development, not semester commitments.

## Personal side notes — future ideas

After CallingIn, I’d like to explore an AI-assisted memoir-writing platform.
I’m also considering whether Trusted Circle should become a separate application,
depending on user research and a feasibility assessment.

This could lead to three focused applications: CallingIn as an AI communication
coach, a standalone Trusted Circle app, and an AI memoir-writing assistant.
These are exploratory ideas, not changes to the current project scope.

## Planned Technology Stack

| Area            | Technology                                              |
| --------------- | ------------------------------------------------------- |
| Language        | JavaScript                                              |
| Frontend        | React, HTML, and CSS                                    |
| Backend         | Node.js and Express                                     |
| Database        | MongoDB with the native Node.js driver                  |
| Authentication  | Passport.js, server-side sessions, and password hashing |
| AI integration  | OpenAI API or another approved language model API       |
| Version control | Git and GitHub                                          |

AI API credentials will remain on the backend and will not be
included in frontend code or committed to the repository.

## Architecture

The planned application has three main parts:

1. **React frontend:** Displays pages, forms, invitations, and messages.
2. **Express backend:** Handles authentication, permissions,
   application rules, and AI requests.
3. **MongoDB database:** Stores users, invitations, conversations,
   and messages.

The frontend will communicate with the backend through API requests.
Only the backend will communicate directly with the database and
the AI provider.

## Development Process

Development will follow short sprints with clear deliverables.

Each sprint will include:

- A defined goal and limited scope.
- Small, understandable commits.
- Relevant tests and quality checks.
- Updated documentation.
- A review of completed and unfinished work.

Work will take place on sprint branches and be merged into main
after review.

### Planned Branches

| Sprint | Branch                     | Focus                                        |
| ------ | -------------------------- | -------------------------------------------- |
| 1      | `sprint-01-planning`       | Documentation and application foundation     |
| 2      | `sprint-02-authentication` | Accounts, profiles, and database integration |
| 3      | `sprint-03-invitations`    | Invitation creation and response workflow    |
| 4      | `sprint-04-conversations`  | Private messaging and Social Battery         |
| 5      | `sprint-05-ai-coach`       | AI drafting and refinement                   |
| 6      | `sprint-06-evaluation`     | Evaluation, fixes, and final deliverables    |

Future branches will be created when their sprint begins.
This table describes the planned workflow. The Sprint 1 React and Express
starter is included in this repository.

See the [Sprint Plan](doc/sprint-plan.md) for dates and deliverables.

## Code Quality

The project combines automated quality gates with a manually invoked AI review:

- **Cyclomatic complexity:** ESLint's `complexity` rule limits cyclomatic
  complexity to **10 per function**. This measures branching through code and
  helps identify functions that are difficult to understand or test. Exceeding
  the limit fails linting. Additional rules limit nesting depth to 4, parameters
  to 4, and function length to 60 lines, excluding comments and blank lines.
- **ESLint:** `npm run lint` detects potential mistakes and enforces coding and
  React Hooks rules with zero warnings allowed. Rules live in `eslint.config.mjs`.
- **Type checking:** `npm run typecheck` runs TypeScript's JavaScript checker
  (`tsc`) with strict `checkJs`, JSDoc, and `noEmit`. Application code remains
  JavaScript. Type checking is separate from ESLint and currently covers frontend
  and backend application source, not tests or tooling configuration.
- **Formatting and pre-commit checks:** Prettier checks consistent formatting.
  Husky and lint-staged run ESLint and Prettier on matching staged files before
  commits; this fast hook does not run the full test suite or type checker.
- **Automated tests:** Node's built-in test runner covers registration, password
  hashing/verification, sessions, login/logout, profile access/updates, request
  protection, rate limiting, safe failure handling, and server startup/shutdown.
  `npm run test:coverage` reports backend source coverage; no minimum coverage
  threshold is enforced.
- **Browser tests — Playwright:** `npm run test:e2e` runs Chromium checks for
  account screens, keyboard field navigation/focus, password guidance/errors,
  and mock sign-in/sign-out. An isolated frontend server and simulated API
  responses keep these checks independent of Atlas and private credentials.
- **Accessibility scans — axe-core:** `@axe-core/playwright` checks the rendered
  sign-in, registration, and profile views for common accessibility problems,
  such as missing labels and insufficient contrast. The current scans use
  supported WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA tags, without rule exclusions.
  Passing scans do not establish full accessibility or WCAG conformance.
  See the [browser/accessibility guide](doc/sprint-03/browser-accessibility-testing.md)
  for browser installation, commands, reports, and verification limits.
- **GitHub Actions continuous integration (CI):** The Quality workflow in
  `.github/workflows/quality.yml` runs on pushes to `main` and sprint branches,
  pull requests to `main`, and manual dispatch. It installs locked dependencies,
  then checks linting (including cyclomatic complexity), formatting, JavaScript
  types, backend tests with coverage, the frontend build, Playwright/axe browser
  checks (with Chromium installation), and dependency security
  audits for all three packages. Failed checks fail the workflow. Deployment is
  separate; required merge checks depend on GitHub branch-protection settings.
  The `.git` directory stores repository metadata, not the CI workflow.
- **Claude quality-review skill:** The project-local
  [quality-review skill](.claude/skills/quality-review/SKILL.md) is invoked manually
  with `/quality-review` or `/quality-review full`. It runs project checks and
  reviews duplication, documentation accuracy, meaningful tests, and guardrail
  gaps. It reports measured results separately from review judgments and proposes
  fixes for human approval. It is read-only and is not an automatic CI gate or
  a replacement for tests and human review.

The separate JSX accessibility lint plugin remains deferred due to compatibility;
Playwright and axe-core are now configured. Human checks still cover keyboard-only
operation, clearly visible focus, zoom/reflow, and screen-reader behavior.
Automated scans and keyboard smoke tests support these checks rather than replace
them. Browser tests currently use Chromium only; other-browser behavior remains
outside that automated coverage.

The professor's Rust checklist is retained as reference material.
Its Rust commands do not apply to this JavaScript application.

## Testing and Evaluation

Technical testing will focus on:

- Registration and authentication.
- Invitation states and recipient choices.
- Access restrictions for private conversations.
- Message validation and storage.
- AI request failures.
- The complete invitation-to-conversation flow.

The academic evaluation will consider usability, clarity, and
whether AI suggestions preserve the user's intended meaning
and perceived voice.

Any participant evaluation will follow the advisor's guidance
and applicable university requirements. The final report will
distinguish observed findings from assumptions and limitations.

## Design References

The following images are earlier concept explorations.
They include Trusted Circle and other details that are outside
the current semester scope.

### Interface Concept

![CallingIn interface concept](public/images/callingin_concept.png)

### Application Wireframe

![CallingIn wireframe](public/images/figma_wire_frame.png)

Updated visuals will reflect the AI-focused MVP and the final
invitation wording. The wireframe is a PNG concept, not an
editable Figma project.

## Project Documentation

- [Sprint Plan](doc/sprint-plan.md)
- [Daily Commands](doc/daily-commands.md)
- [Sprint 01 Commands](doc/sprint-01/commands_sprint-01.md)
- [Sprint 1 Progress](doc/sprint-01/sprint-01-progress.md)
- [Sprint 1 AI Development Log](doc/sprint-01/ai-development-log-1.md)
- [Sprint 1 Testing and Quality Gates](doc/sprint-01/notes_testing_qualitygate_sprint-01.md)
- [Advisor Meeting 01 — September 15, 2026](doc/meetings/meeting-01_2026-09-15.md)
- [Advisor Meeting 02 — September 29, 2026](doc/meetings/meeting-02_2026-09-29.md)
- [Original Project Proposal](doc/CS8674_Project_Proposal_and_Semester_Plan_Shorena_Anzhilov.pdf)
- [Code Quality Tools Chart](materials/code-quality-tools.png)
- [Professor's Rust Quality Checklist](materials/check-rs.md)

Semester-wide documents are in `doc/`, meeting files are in
`doc/meetings/`, and Sprint 1 records are in `doc/sprint-01/`.
The command guide and Sprint 1 verification records describe the included
React and Express starter.

The original proposal records the initial semester plan.
This README and the sprint plan describe the revised MVP scope.

## Academic Deliverables

- Literature review and references.
- Requirements, wireframes, and architecture.
- Database design.
- Working CallingIn MVP.
- Source code and development documentation.
- Evaluation findings and limitations.
- Final report.
- Project presentation.
- Written reflection.

Advisor meetings are planned every other week beginning
September 15, 2026, with adjustments as needed.

The target project finish is approximately December 11.
Final submission dates will be confirmed with the advisor.
The proposal specifies that the reflection is due on the
Friday before finals week.

## Running the Project

The current application includes a React welcome page, an Express health
endpoint, a Vite development proxy, MongoDB connectivity, and a backend
registration endpoint with password hashing and unique email storage. Login,
logout, sessions, profile endpoints, and frontend account forms are not yet
implemented. AI requests, invitations, and private messaging remain planned;
Trusted Circle remains future work.

### Prerequisites and installation

Use Node.js 26.x and npm. `.nvmrc` selects the verified version `26.0.0`, and
GitHub CI reads that same file. All three packages declare Node
`>=26.0.0 <27`. These declarations document compatibility; they do not switch
your installed runtime automatically, and npm normally warns on mismatches.

If you use the nvm version manager, run from the repository root:

```bash
nvm install
nvm use
node --version
```

These select the version in `.nvmrc`. If you do not use nvm, use your Node
version manager to select `26.0.0` before running the checks. Update `.nvmrc`
when deliberately upgrading the tested version; CI follows that file.

From the repository root, install the three sets of dependencies:

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

The root package contains shared ESLint, Prettier, React lint plugins, and pre-commit tools.
`eslint.config.mjs` defines common rules once and applies browser/React rules
to the frontend and Node.js rules to the backend. Install root dependencies
before running either application's lint or formatting commands. Its `prepare` script
activates Husky for this local clone. The frontend and backend each have
their own application dependencies and lockfile.

### Backend environment configuration

Starting the backend requires `MONGODB_URI` and `MONGODB_DB_NAME` for your Atlas
or local MongoDB database. Automated tests use controlled connections and do
not require real credentials. The backend defaults to port `3001`.
To create the private configuration, run this once from the root,
only if `backend/.env` does not already exist:

```bash
cp -n backend/.env.example backend/.env
```

Fill in the private connection settings in `backend/.env`; never place real
credentials in `.env.example`. Backend startup loads `.env` when present and
refuses to start if database settings are missing or the connection fails. Keep `PORT=3001`
to match the target in `frontend/vite.config.js`; if you change the port,
update that proxy target too. Real `.env` files are ignored by Git; the
example contains no secrets. The frontend needs no environment file.

### Start the application

In one terminal, from the repository root:

```bash
npm --prefix backend run dev
```

In a second terminal, from the repository root:

```bash
npm --prefix frontend run dev
```

Open <http://127.0.0.1:5173/>. The page checks `/api/health` through Vite,
which forwards the request to Express at <http://127.0.0.1:3001>.
Both servers must be running for a connected status. Stop each server
with Ctrl+C in its terminal. The backend also supports
`npm --prefix backend start` without automatic restart.

### Verify the starter

Run from the repository root:

```bash
npm run check
```

The combined check runs frontend/backend linting, repository formatting,
JavaScript type checks, backend tests, and the frontend build. It stops if a
step fails. Tests cover health routes, registration, database failures, and
startup/shutdown using temporary localhost servers and controlled dependencies.
They do not create live Atlas accounts or require private database settings.

Run `npm run test:coverage` separately for a backend coverage report. Dependency
audits are separate from `npm run check`, but run in the GitHub Quality workflow.

The build writes generated files to `frontend/dist/`; the ignore rule covers new
untracked output, but some older build files remain tracked pending cleanup.
A successful build does not deploy or start the application.

With both development servers running, check the proxy:

```bash
curl --fail http://127.0.0.1:5173/api/health
```

Expected response: `{"status":"ok"}`.

### Formatting and pre-commit checks

Use `npm --prefix frontend run format` or
`npm --prefix backend run format` to format application files.
For a specific root document, use the locally installed formatter:

```bash
npx --no-install prettier --write README.md
```

When you commit, Husky runs ESLint on staged application JavaScript and
Prettier on supported staged text files. It blocks a commit on failure
without automatically formatting the files. Fix and review the reported
issues, then stage the corrections yourself. Builds and tests remain
separate commands so the hook stays fast.

To check files you have staged without committing:

```bash
npm run precommit
```

With no staged files, this command skips checks. lint-staged temporarily
hides unstaged portions of partially staged files and uses a backup stash;
let it finish before making further edits. See the
[frontend instructions](frontend/README.md) for additional details.

© 2026 Shorena K. Anzhilov. All rights reserved. This source code is publicly available for viewing purposes only. No permission is granted to copy, modify, distribute, or use this code without prior written permission.

## Collaboration agreement — Shorena, Codex, and Claude

This is a human-led team with three roles: Shorena as the developer/project
owner, Codex as the primary implementation assistant, and Claude as an
independent review assistant. These are agreed responsibilities, not a claim
that either AI tool is always better at a particular task.

| Team member | Responsibilities                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shorena** | Sets scope and priorities; asks WHAT, WHY, and HOW; approves changes; chooses which review recommendations to adopt; performs personal/browser checks; owns staging, commits, pushes, merges, and final decisions.                |
| **Codex**   | Inspects the project, explains proposed actions, implements approved features/refactors, debugs, runs approved checks, and documents actual results and limitations.                                                              |
| **Claude**  | Independently reviews Codex's changes using the manually invoked quality-review skill; checks duplication, documentation, test meaningfulness, and missing guardrails; reports evidence and proposed fixes for Shorena to select. |

Before edits, installations, or submissions, either assistant must explain
**WHAT** will change, **WHY** it is needed, and **HOW** it will be implemented
and checked, then wait for approval. Approval covers the agreed step, not an
unlimited sequence of changes. Neither assistant handles Git submissions unless
Shorena explicitly delegates that action. Credentials stay private.

The normal flow is: Shorena defines and approves a small task; Codex implements
and verifies it; Shorena invokes Claude's review before a PR or sprint completion;
Shorena chooses any fixes, reviews the results, and handles Git submissions.
If Claude implements a change, Codex can provide the independent review instead.
Only one assistant should edit a given task at a time. Running both agents on
every small change is unnecessary; routine checks use `npm run check`.

The `/quality-review` skill is manual, not scheduled. An agent may suggest a
review but must not start it unprompted. Measured check results, agent judgments,
and work not checked must remain separate in reports. Agent review and coverage
percentages support, rather than replace, executable tests and human judgment.
GitHub CI runs separately according to its configured triggers; the review
skill does not grant permission to change files or submit work.

## Daily workflow and weekly progress

- [Daily commands and sprint completion](doc/daily-commands.md)
- [Project journey](doc/project-journey.md)

## JavaScript type checks

Run `npm run typecheck` from the root to check frontend and backend application
source using TypeScript's JavaScript checker and JSDoc. Source stays `.js`/`.jsx`;
`noEmit` prevents generated files. `npm run check` includes this step. Tests and
configuration files are not yet part of the type-check scope.

## GitHub quality checks

`.github/workflows/quality.yml` defines a **Quality checks** job for main/sprint
pushes and pull requests to main. It installs all three locked package sets and
runs lint, formatting, JavaScript type checks, backend coverage tests, frontend
build, and dependency audits without Atlas credentials. Deployment is separate.
After pushing and obtaining a green run, configure main's required status checks
in GitHub settings; committing the workflow alone does not enforce merge rules.
