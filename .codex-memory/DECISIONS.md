# CallingIn — Decisions

**Compiled:** October 17, 2026. Entries summarize decisions from the available
conversation and repository; do not infer approval for unfinished proposals.

| ID  | Decision                                                       | Reason / boundary                                                                                                                               |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | React/Vite and Node/Express, with JavaScript source            | Keep the chosen stack; no Rust or application TypeScript migration.                                                                             |
| D02 | Atlas and the native MongoDB driver                            | Hosted development database; driver installed in backend only.                                                                                  |
| D03 | Registration uses display name, email, password; salted scrypt | Validate input and store hashes, not passwords. Unique normalized email index.                                                                  |
| D04 | Session/login design remains undecided                         | A prior MongoDB-session/cookie suggestion was not implementation approval. Agree before coding.                                                 |
| D05 | Shared lint/format tools at project root                       | Remove duplicated tools/config while keeping application packages separate. No global-machine ESLint installation.                              |
| D06 | Complexity 10, depth 4, params 4, function lines 60            | Reviewable, testable functions; exclude comments/blanks from length. Do not create meaningless abstractions.                                    |
| D07 | Node test runner retained; coverage reporting added            | No Vitest migration. Thresholds remain a separate decision.                                                                                     |
| D08 | checkJs/JSDoc with strict and noEmit for app source            | TypeScript checks JavaScript without generating files. Tests/configs excluded initially.                                                        |
| D09 | Node 26.0.0 in .nvmrc; engines >=26.0.0 <27                    | Align selected local version and CI. Engines are normally advisory without engine-strict.                                                       |
| D10 | GitHub CI separate from deployment/branch protection           | Workflow does not deploy, merge, or by itself require green checks on main.                                                                     |
| D11 | Accessibility setup deferred                                   | Unsupported declared JSX-plugin pairing; Playwright plus axe discussed but not installed pending professor input.                               |
| D12 | Codex implements; Claude independently reviews; user decides   | Practical three-role agreement, not a universal model-quality claim. Swap reviewers if Claude implements.                                       |
| D13 | WHAT/WHY/HOW and approval before new changes                   | Preserve understanding and human control; only one agent edits a task at a time.                                                                |
| D14 | User normally runs Git submissions                             | October 17 delegations were task-specific; 7561929, 29fee22, 36cfdab, 1bf6ea2 were explicitly delegated commits/pushes. No standing permission. |
| D15 | No Sprint 02 merge until the end                               | Separate implementation from main shared documentation; explicit final approval required.                                                       |
| D16 | Shared README and journey maintained on main                   | Branches inherit README; do not delete inherited copies. The user left the latest sprint README edit local for now.                             |
| D17 | Claude skill is manual and reports evidence separately         | /quality-review for changes; full at sprint completion. No auto-schedule or automatic fixes.                                                    |
| D18 | Multilingual interface/message translation is future work      | Preserve original text and user review; outside Sprint 02 commitments.                                                                          |
| D19 | Memory is curated files on main                                | AGENTS.md plus index/state/decisions/sessions; saving does not imply Git submission or a full transcript archive.                               |

Supersede decisions with dated entries rather than silently deleting their
history. Revalidate version-compatibility findings when they are revisited.

## October 29, 2026 — Superseding decisions and handoff

- D04 superseded: MongoDB-backed cookie sessions and optional 90-day inactivity
  persistence are implemented. Logout invalidates even persistent sessions.
- D15 fulfilled: user explicitly approved Sprint 2 merge; 38a9a3c is pushed on main.
- D16's uncommitted README note is historical: current future-app note was committed
  as 274f8d1 and merged. Three possible applications remain exploratory, not scope changes.
- D19 retained: save curated memory on main; never imply a full transcript or
  automatic cross-chat recall. User specifically requested this handoff to help
  avoid confusion/hallucinated assumptions; effectiveness has not been measured.
- Sprint 3 setup approved: local branch sprint-03-invitations from merged main,
  planning records only. Invitation implementation needs a design and approval.
- Password changes/all-session invalidation and deployment proxy trust deferred.
- User reported main CI green and browser checks passed; preserve documented
  verification limits rather than claiming independent live Atlas certification.
- Current save/meeting/setup approval does not grant new commit/push permission,
  ongoing Git delegation, multi-agent spawning, AWS access, or business automation.
