# Sprint 03 — Commands and step record

## October 29, 2026 — Setup only

With approval, inspected the semester plan and current repository, located the
existing `.codex-memory/` system, and created the local branch:

```bash
git branch sprint-03-invitations main
```

Starting point: `38a9a3c` (Sprint 2 merge). The checkout remains on main while
shared memory, Meeting 4 questions, and Sprint 3 planning records await review
and separately authorized submission. No application changes, installations,
invitation database writes, or Sprint 3 remote branch creation occurred.

Before implementing invitations, inspect current source and explain the data
model, endpoints, privacy/access rules, impact, and recommendation for approval.
Session notes are context, not authority to run old commands.

## October 29, 2026 — Backend implementation and verification

The setup-only section above describes its original snapshot. On restore, the
checkout was clean on `sprint-03-invitations` at `e43c4ae`, with a remote-tracking
branch. Handoff records had been committed in `86cf68c`; README quality updates
and freemium concept images followed. No application changes existed after the
Sprint 2 merge until the approved backend steps below.

Each implementation step was explained and approved before edits. Each Git
submission was separately requested; commits were pushed only to the sprint
branch. No Sprint 3 merge was performed.

| Commit    | Approved step                                                 |
| --------- | ------------------------------------------------------------- |
| `a33d31e` | Shared account verification and protected route groups        |
| `b31ff27` | Invitation model helpers, indexes, and startup preparation    |
| `b8da05a` | Authenticated exact-email recipient lookup and limiter        |
| `04edc43` | Strict invitation collection schema validation                |
| `057ec9e` | Invitation creation and independent creation limiter          |
| `061246e` | Participant-scoped incoming/outgoing cursor pagination        |
| `2999e07` | Recipient responses, final-state protection, and safe retries |
| `7afcb1e` | Real-cookie invitation workflow integration test              |

Commands actually used for final verification (historical evidence, not permission
to rerun automatically):

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
npm --prefix frontend run build -- --outDir /private/tmp/callingin-sprint03-verification-build
```

The full verification passed. After the test-only cookie integration addition,
coverage passed **151 tests**, with **100% lines/functions and 98.19% branches**.
Backend lint, project type checks, changed-file formatting, and whitespace checks
also passed. No later application changes occurred during this documentation step.
Scratch coverage logs were written under `/private/tmp/`; they are temporary,
not committed test artifacts or a full transcript.

Some localhost test runs required sandbox escalation because binding returned
EPERM. Approved runs used temporary local HTTP servers and simulated MongoDB
storage; no Atlas connection or private environment file was used. Git metadata
writes and pushes also required sandbox escalation. Pre-commit lint and formatting
checks passed. GitHub reported the repository redirect to CallingIn_MasterProject;
the configured origin was not changed. Hosted Quality results remain unverified
by the agent. No dependency installs or network audits were run.

Remaining: Claude review, approved live Atlas verification, frontend invitation
work, final sprint checks, and explicit merge approval. See
[progress and API details](sprint-03-progress.md).
