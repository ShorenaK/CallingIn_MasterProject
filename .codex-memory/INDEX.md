# CallingIn memory index

**Initialized:** October 17, 2026 (America/New_York)

This is an intentionally curated, file-based handoff system. It is not a full
chat archive or proof of cross-chat recall. Read current state first and verify
against source/Git. Canonical copies are maintained on main.

- [Current project state](PROJECT_STATE.md)
- [Technical and workflow decisions](DECISIONS.md)
- [Save/Restore commands](COMMANDS.md)
- [Permanent agent instructions](../AGENTS.md)

## Sessions

| ID  | Saved date | Topics                                                                                                                     | Branch context                                | Record                                                                                                                  |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 001 | 2026-10-17 | Sprint 01 handoff; Sprint 02 database, registration, quality checks, Claude audit/skill, research journey, memory setup    | main and unmerged sprint-02-authentication    | [001 — foundation and quality](sessions/001-sprint-02-foundation-and-quality.md)                                        |
| 002 | 2026-10-29 | Sprint 2 implementation/review fixes, live-check reports, merge, Sprint 3 setup, Meeting 4 questions                       | main at 38a9a3c; local Sprint 3 branch        | [002 — closeout and handoff](sessions/002-sprint-02-closeout-and-sprint-03-handoff.md)                                  |
| 003 | 2026-11-02 | Sprint 3 merge, quality fixes/reviews, dependency security, draft/keyboard/pagination, deferred tasks and Sprint 4 handoff | main at 0921e62; retained Sprint 3 at 2b9912c | [003 — Sprint 3 closeout and Sprint 4 handoff](sessions/003-sprint-03-closeout-and-sprint-04-handoff.md)                |
| 004 | 2026-11-03 | Sprint 4 conversations/UI, Social Battery, Claude review/fixes, navigation, automated/live evidence and merge readiness    | Sprint 4 at 589032c; main at 1db8bd9          | [004 — Sprint 4 implementation and verification](sessions/004-sprint-04-conversations-battery-and-live-verification.md) |

Next session ID: **005**, provided it remains unused when saving.

## Fast continuation

Latest handoff: **CX Restore Session: 004 — Sprint 4 implementation and verification**.

```text
CX Restore Session: 004 — Sprint 4 conversations, battery, and live verification.
Read AGENTS.md, .codex-memory/INDEX.md, PROJECT_STATE.md, DECISIONS.md, and session
004. Inspect Git/worktrees/current source and the latest Sprint 4 progress,
checklist, review and live verification reports in the Desktop checkout.
Expected Sprint 4 checkpoint 589032c; main 1db8bd9. Verify, don't assume.
Conversations, Social Battery, permanent browser tests and navigation guards
are implemented. Claude reviewed fd0b855; later changes need focused review.
Recorded evidence: 267 backend, 79 mocked Chromium tests, 101 live assertions.
Don't rerun or claim these as current results without checking the evidence.
Explain remaining work/readiness and wait for approval before implementation,
network/live checks, Git submissions or merging. User intends review then merge;
final merge approval and review of outstanding limitations are still required.
Leave completed Sprint 3 untouched. Keep explanations short and practical.
```

Canonical memory is on main; matching session 004 files are copied into Desktop
Sprint 4 for direct access. Both copies are local/uncommitted from this save until
separately submitted. Main checkout at save is
`/private/tmp/CallingIn-main-design-20261103`; locate again with git worktree list.
Old followups-20261102 directory is absent. Sprint 4 source/docs remain unmerged;
read Desktop, do not merge merely to obtain context. No full transcript archived.
