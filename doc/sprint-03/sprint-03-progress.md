# Sprint 03 Progress — Invitations

**Actual setup date:** October 29, 2026 (America/New_York)  
**Branch:** `sprint-03-invitations`  
**Starting commit:** `38a9a3c` on merged `main`  
**Status:** Local branch and planning records prepared. No invitation implementation approved or written.

## Goal

Add authenticated user lookup, invitation creation, incoming/outgoing lists,
accept/decline responses, authorization checks, and meaningful tests.
This follows the semester plan; original calendar targets are historical and
need advisor agreement before revised deadlines are recorded.

## Proposed implementation sequence — approval required

1. Inspect current session protection, database lifecycle, and frontend account state.
2. Agree on lookup privacy, invitation fields/statuses, duplicate/self-invitation
   rules, recipient-only responses, and how accepted invitations feed Sprint 4.
3. Explain WHAT/WHY/HOW/WHERE/IMPACT/RECOMMENDATION for the model and API.
4. After approval, implement storage/indexes and protected endpoints in small steps.
5. After approval, add frontend invitation flows using the existing React design.
6. Add meaningful success/failure/access-control tests and run project checks.
7. Perform manual verification, document evidence/limits, review, and merge only
   with explicit approval.

## Setup and handoff

- [x] Sprint 2 merged into main as `38a9a3c` and pushed.
- [x] Student confirmed the main GitHub Quality run green.
- [x] Created local `sprint-03-invitations` from that merge.
- [x] Prepared this record and the commands record.
- [ ] Review/submit shared handoff and Meeting 4 updates on main.
- [ ] Update the Sprint 3 branch from the resulting main commit before switching.
- [ ] Approve invitation model/API design.

The current checkout remains on main because canonical memory and meeting records
are being prepared there. These setup records and memory are uncommitted until
separate Git approval. No Sprint 3 branch push or application change was performed.
See [session handoff](../../.codex-memory/sessions/002-sprint-02-closeout-and-sprint-03-handoff.md).
