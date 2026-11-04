# Invitation resend after a decline

**November 4, 2026 — implementation and migration preparation.**

Shorena approved local code, UI, tests, and migration preparation, explicitly
excluding live database changes. The implementation is off by default. No live
migration, backup, database inspection, configuration change, or activation was
performed. Earlier timing foundation: `8cdfddd`; review:
[Claude's timing report](quality-review-2026-11-04-8cdfddd.md).

## Agreed behavior

- The wait starts at the final server-recorded decline (`respondedAt`), not at
  send time or Maybe Later. Thirty days means 30 elapsed 24-hour periods.
- Either participant can send a new invitation once that wait has elapsed.
  Exactly at the deadline is allowed; earlier is blocked.
- Pending, Maybe Later, and accepted current invitations block another invitation.
  Accepted conversations and their messages are unchanged.
- Repeating a decline does not restart the wait. A newly sent invitation that is
  later declined starts a new wait from that new decline.
- Preserve every invitation as history. Do not delete or rewrite old decisions.
  A resend is a new invitation, not a change to an old one.
- Invalid/missing decline dates and missing/inconsistent current-pair data block
  sending and produce a safe error; a missing date never means “no wait.”
- The sender sees this simple message on the current declined invitation:
  **“They need some space. You can send another invitation 30 days after they decline.”**
  No exact date or countdown is displayed. There is no automatic resend; use the
  existing Find person → compose → Send invitation flow.

## Storage and concurrency

Existing `invitations` documents and their strict validator are unchanged.
The new `invitationPairs` collection holds only:

| Field          | Purpose                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `_id`          | Canonical unordered pair key; MongoDB's unique `_id` index serializes the pair |
| `invitationId` | ObjectId pointing to the current invitation                                    |

Strict validation allows only these fields. The legacy unique `pairKey` index
on `invitations` must be replaced with a nonunique `invitation_pair_history`
index. Participant/time/ID pagination indexes remain unchanged.

When enabled, creation uses native MongoDB `withTransaction`, snapshot reads,
and majority writes. It reads the current pointer and invitation, checks the
current state/cooldown using server time, updates the pointer, and inserts the new
invitation in the same transaction. Conflicting transactions must retry the whole
operation through the driver or return a safe conflict. There is no unsafe
nontransactional fallback. A replica set or sharded cluster with transaction
support is required. Simulated tests do not establish actual MongoDB atomicity.

A missing pointer is allowed only when no invitation exists for that pair. This
prevents untracked historical data from being treated as a first invitation.

## API/UI rollout

Normal configuration leaves `INVITATION_RESEND_ENABLED` unset or `false` and keeps
the old permanent-pair policy. It does not load any new private configuration here.

Only after the separately approved migration and verification may the operator
set `INVITATION_RESEND_ENABLED=true`. Other values fail startup. Enabled startup
checks the pair validator, absence of permanent pair uniqueness, and presence of
the history index. It never automatically drops an index or performs the backfill.

Existing POST creation remains authenticated, origin/JSON protected, rate limited,
and strict about accepted fields. It returns a new invitation on success. Safe
409 codes distinguish `INVITATION_COOLDOWN` and `INVITATION_ACTIVE`; the frontend
explains them while retaining the draft. The request body contains no timer or
pair key from the browser.

List/response serialization marks only a current, valid declined invitation with
`resendPolicy: "decline-30-days"`, and only in enabled mode. Historical declines
are not advertised as another resend opportunity after a new invitation exists.
Lists fetch current pointers in one bounded batch for the authorized page; pair
keys are internal and never serialized. Incoming cards do not show the sender
notice. Default-off mode does not promise resending before activation.

## Migration procedure — not executed; separate approval required

Preparation code:

- `backend/src/invitation-resend-migration.js`: inspection and guarded apply.
- `backend/scripts/migrate-invitation-resend.js`: explicit operator entry point.

Before any database access or changes, review this procedure and obtain separate
approval for the exact database/environment. Then:

1. Identify the target database and all application writers. Inspect the existing
   validator/indexes and transaction-capable topology with authorized read-only
   checks. Confirm permissions and the tested application version.
2. Obtain and verify a restorable backup using a separately approved method.
   Record evidence outside secret-bearing logs. A `backup-reference` argument is
   an operator acknowledgment, not automatic proof that a backup exists.
3. Stop all writers, including old application versions and test scripts. A CLI
   flag cannot prove that other processes have stopped. Keep them stopped until
   migration and verification finish.
4. Run the read-only plan. It checks topology, exactly one old unique pair index,
   canonical pair identities, at most one existing invitation per pair, supported
   statuses, and usable decline dates. The CLI prints a count, not invitation
   text, emails, pair IDs, credentials, or raw driver errors.
5. After reviewing the plan, run the separately approved apply. It creates or
   verifies the strict pair collection and seeds pointers without overwriting
   conflicting ones. It checks all pointers and re-inspects the legacy records
   before creating the nonunique history index. **Dropping the old unique pair
   index is the last index-changing operation**, followed by storage verification.
   Invitations, conversations, users, and messages are not deleted.
6. If interrupted before dropping the old index, keep writers stopped, inspect
   the failure, and review resumption. Correct partial pointer backfills can be
   resumed; conflicting/extra pointers or weak validators stop the operation.
   Once the old index has been removed, the legacy-only migration refuses an
   automatic rerun. Inspect and repair forward under separate approval instead.
7. Configure the reviewed app with the flag true and verify startup, transaction
   behavior, old history, and participant isolation before restoring access.
   Perform approved live boundary and simultaneous-request checks with isolated
   accounts. Use a controlled server clock/test database rather than modifying
   real user decline dates or weakening enforcement to avoid waiting.

Example commands below are instructions for a future approved operator action,
**not commands run during implementation**. They let the application load private
settings without displaying them. Replace `TARGET_DB` and `BACKUP_RECORD` with
the approved exact database and a nonsecret backup evidence reference.

```bash
node --env-file-if-exists=backend/.env backend/scripts/migrate-invitation-resend.js --plan --database=TARGET_DB
```

```bash
node --env-file-if-exists=backend/.env backend/scripts/migrate-invitation-resend.js --apply-reviewed-migration --database=TARGET_DB --writers-stopped --backup-reference=BACKUP_RECORD
```

### Rollback limitations

Do not run an old writer or simply unset the flag after activation. The legacy
startup tries to enforce permanent uniqueness again; after history contains
multiple invitations for a pair, that index cannot be recreated. No automatic
rollback deletes history. Prefer a reviewed forward fix with writers stopped.
Restoring a backup or reversing indexes requires separate approval and a plan
for any new data created since the backup. If activation has not happened yet,
review database state before deciding how to undo a partial migration.

## Verification and remaining approval

Tests use controlled clocks, local HTTP, simulated storage/transactions, and
mocked browser APIs. They cover exact timing, both sending directions, existing
active states, missing/corrupt state, rollback, simultaneous attempts, repeated
declines, history/notice serialization, migration acknowledgment/failure paths,
and frontend draft retention. Detailed measured totals are in the
[progress record](sprint-05-progress.md).

Before activation: independent review of code and migration, explicit live
inspection/backup/migration approval, real transaction/index verification, and
isolated live acceptance checks. No passing mocked test substitutes for those
steps. Human accessibility checks remain separately pending.
