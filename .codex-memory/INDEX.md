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

| ID  | Saved date | Topics                                                                                                                     | Branch context                                | Record                                                                                                   |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 001 | 2026-10-17 | Sprint 01 handoff; Sprint 02 database, registration, quality checks, Claude audit/skill, research journey, memory setup    | main and unmerged sprint-02-authentication    | [001 — foundation and quality](sessions/001-sprint-02-foundation-and-quality.md)                         |
| 002 | 2026-10-29 | Sprint 2 implementation/review fixes, live-check reports, merge, Sprint 3 setup, Meeting 4 questions                       | main at 38a9a3c; local Sprint 3 branch        | [002 — closeout and handoff](sessions/002-sprint-02-closeout-and-sprint-03-handoff.md)                   |
| 003 | 2026-11-02 | Sprint 3 merge, quality fixes/reviews, dependency security, draft/keyboard/pagination, deferred tasks and Sprint 4 handoff | main at 0921e62; retained Sprint 3 at 2b9912c | [003 — Sprint 3 closeout and Sprint 4 handoff](sessions/003-sprint-03-closeout-and-sprint-04-handoff.md) |

Next session ID: **004**, provided it remains unused when saving.

## Fast continuation

Latest handoff: **CX Restore Session: 003 — Sprint 3 complete; Sprint 4 planning**.

```text
CX Restore Session: 003 — Sprint 3 closeout and Sprint 4 handoff.
Read AGENTS.md. Use git worktree list to locate the main checkout and read its
actual .codex-memory/INDEX.md, PROJECT_STATE.md, DECISIONS.md, and session 003.
The memory save may still be uncommitted, so do not rely only on git show main.
Read doc/deferred-tasks.md, doc/sprint-plan.md, README.md, and the latest Sprint 3
closeout notes from main. Inspect current Git status, worktrees, commits, and source.
Sprint 3 was merged as 0921e62 and its GitHub Quality passed at the save checkpoint.
Explain what is complete, what carries into Sprint 4, and the first proposed
backend step using WHAT, WHY, HOW, WHERE, IMPACT, and RECOMMENDATION.
Use short practical explanations and everyday analogies. Wait for my approval
before edits, installations, branch/worktree changes, Git submissions, or merging.
```

Main checkout at save: `/private/tmp/CallingIn-main-followups-20261102`; temporary,
locate again before use. Desktop remains on retained Sprint 3. This new memory
save is local until separately committed/pushed. No full transcript was archived.
