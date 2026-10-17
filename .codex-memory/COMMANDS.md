# CX memory commands

These are prompts to the coding agent, not shell commands, installed slash
commands, or a background service. The agent must have access to this repository
and read AGENTS.md. A new chat does not automatically contain the deleted chat.

## CX Save Session

Say:

```text
CX Save Session
```

Optional topic:

```text
CX Save Session: Sprint 02 login design
```

The agent creates the next numbered session record, updates INDEX/PROJECT_STATE/
DECISIONS as needed, verifies the files, and reports what was saved. It records
completed tasks, changed files, decisions, bugs, tests, approvals, and next steps.
It must distinguish summaries from a full transcript and confirm archive status.
It does not stage, commit, push, merge, or export a transcript without separate
approval. No private .env contents, tokens, passwords, or credential-bearing
connection strings belong in any memory file.

## CX Restore Session

Open the main checkout containing these files, then say:

```text
CX Restore Session
```

Or choose a topic/ID:

```text
CX Restore Session: 001, Sprint 02 authentication
```

The agent reads AGENTS.md, INDEX, PROJECT_STATE, DECISIONS, relevant sessions,
and current source/Git state. It explains what is done, what changed, what is
pending, and a proposed next step. Restore itself is read-only; it is not
permission to resume all old commands or automatically implement a plan.

If a new chat opens on a branch without these main-only files, use:

```text
Read AGENTS.md and .codex-memory/ in the main checkout listed by git worktree
list. CX Restore Session: Sprint 02. Explain WHAT, WHY, and HOW and wait for
my approval before changes. I handle Git submissions.
```

Do not merge main into the sprint merely to load memory. Ask before switching
branches or creating checkouts. A worktree is another checkout of this same
repository, not another GitHub repository.

## Save durability and transcript status

Initial files were prepared in `/private/tmp/CallingIn-main-docs` on main.
This location is temporary. Review, commit, and push the memory files before
deleting the chat or relying on long-term retention. No such Git submission is
automatically authorized by a Save request.

Suggested user-run submission, from the main checkout after reviewing status:

```bash
git status
git add AGENTS.md .codex-memory/
git diff --cached --stat
git diff --cached --check
git commit -m "docs: initialize Codex session memory"
git push origin main
```

Stop if checks fail or if unrelated staged changes are present. These commands
are documentation only, not commands executed during memory setup.

The initial session is a curated summary. **No full transcript was archived.**
If you need the original wording for research, explicitly export the conversation
using the available app controls, review/redact secrets, and decide separately
where to store it. The memory summary cannot reconstruct a deleted transcript.
