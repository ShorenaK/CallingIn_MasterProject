# Invitation validation — administrator repair guide

**Written:** October 30, 2026 (America/New_York)

This is a repair guide, not a command that runs automatically. Writing it did not
change Atlas. Use it only after the database owner approves the exact target and
update. Like replacing a building's lock, changing database rules is separate from
opening the building each morning.

## When this is needed

The backend checks that an existing `invitations` collection has the expected
validation. Missing or different rules stop startup safely. A new, absent collection
is created automatically; an existing collection is never silently repaired.

The startup message can also indicate connection, permission, or index problems.
Inspect first: do not assume every startup failure needs a validator change.
The current source of truth is
[invitation-storage.js](../../backend/src/invitation-storage.js) and the invitation
message limit in [account-policy helpers](../../backend/src/invitation-policy.js).
Recheck those files before using this dated example. The invitation message limit
of 3,000 is unrelated to the account password length.

## 1. Confirm the target and stop writes

Confirm cluster, database name, collection, active code version, and the reason
for repair with the owner. Test the procedure on a separate database first.
Stop the backend and other writers for the maintenance window. Do not drop the
collection, erase data, disable validation, or grant the running app an admin role
as a shortcut.

Use an administrator connection in a private `mongosh` session, not the app's
regular `.env`. `collMod` requires the appropriate database administrative privilege;
`dbAdmin` provides it. Inspection and data checks also require read access.
Keep credentials out of commands saved in the repository, screenshots, and chat.
The regular application connection should retain its limited database role.

In the following example, replace the placeholder only after confirming the target:

```js
const targetDb = db.getSiblingDB('REPLACE_WITH_APPROVED_DATABASE');
print(targetDb.getName());
const before = targetDb.getCollectionInfos({ name: 'invitations' })[0];
if (!before)
  throw new Error('Collection missing: use normal startup preparation.');
printjson(before.options);
printjson(targetDb.invitations.getIndexes());
```

These commands inspect only. Record the original options and indexes privately;
do not commit private collection contents.

## 2. Back up before modifying

Use the owner's approved Atlas backup/snapshot procedure, or an authorized
`mongodump` of the target collection. Confirm that the backup is available and the
restore procedure is understood. `mongodump` includes collection data and metadata
(options and indexes); a plain JSON document export alone is not that backup.
Keep any backups outside the repository in approved private storage. Tool setup,
backup execution, and data restoration are separate approved actions; no tools
are installed by this guide.

Also preserve the original `before.options` so the prior validator/settings can
be reviewed during recovery. Do not use automatic rollback that disables rules.

## 3. Define the reviewed rules and check existing data

Compare this example with the current source before proceeding. Object property
order does not matter for the backend comparison, but array contents/order and
numeric values must match the source. Do not add descriptions or extra rule keys
without a coordinated application change.

```js
const expectedValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'senderId',
      'recipientId',
      'pairKey',
      'message',
      'status',
      'createdAt',
      'updatedAt',
      'respondedAt',
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: 'objectId' },
      senderId: { bsonType: 'objectId' },
      recipientId: { bsonType: 'objectId' },
      pairKey: { bsonType: 'string', pattern: '^[a-f0-9]{24}:[a-f0-9]{24}$' },
      message: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 3000,
        pattern: '\\S',
      },
      status: { enum: ['pending', 'deferred', 'accepted', 'declined'] },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      respondedAt: { bsonType: ['date', 'null'] },
    },
  },
};
const invalidCount = targetDb.invitations.countDocuments({
  $nor: [expectedValidator],
});
printjson({ invalidCount });
```

Expected: `invalidCount: 0`. If not zero, stop and obtain a separate data-repair
plan. Do not delete records or invent recipient consent/status values. Inspect
only approved records privately to understand the mismatch.

Strict validation checks future inserts and updates; changing the validator does
not repair or retroactively certify old documents. This query checks schema shape,
not all business rules: it does not prove the pair key matches the participants,
that participants differ, or that response history is legitimate. A conflicting
unique index is a separate problem requiring investigation.

## 4. Apply the approved update

This is the write step. Run it only after target, backup, existing-data check,
and the exact validator have been reviewed and approved:

```js
const updateResult = targetDb.runCommand({
  collMod: 'invitations',
  validator: expectedValidator,
  validationLevel: 'strict',
  validationAction: 'error',
});
printjson(updateResult);
```

Expected: `ok: 1`. This changes rules, not invitation contents or indexes. If it
fails, stop and investigate the error privately; do not switch to `warn`,
`moderate`, or bypass validation to get the application running.

## 5. Verify and return to the regular application user

Read back the stored options and repeat the schema count:

```js
printjson(targetDb.getCollectionInfos({ name: 'invitations' })[0].options);
printjson({
  invalidCount: targetDb.invitations.countDocuments({
    $nor: [expectedValidator],
  }),
});
```

Confirm expected rules, `strict`, `error`, and zero invalid documents. Close the
administrative session. Do not copy its credentials into the application settings.
Start the backend with the regular database user and approved database name:

```bash
npm --prefix backend start
```

Confirm successful connection/listening, stop with Ctrl+C, then start again with
the same settings. The second start must accept the stored rules without
`collMod`. Confirm expected indexes and an approved read-only app check. Any new
test invitations or deliberately invalid inserts need their own approved scope.

If startup still fails, keep writers stopped and check the code version, stored
rules, privileges, and index errors. Escalate to the owner. Restoration of a backup
or previous rules requires a reviewed recovery decision, not blind replay.

## 6. Record the maintenance result

Record date/timezone, code commit, approved target, reason, backup reference,
pre/post checks, restart results, limitations, and the approving owner. Never
record credentials or private message contents. This guide has been reviewed
against source and documentation but has not itself been executed against Atlas.

## References

- [MongoDB: modify schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/update-schema-validation/)
- [MongoDB: collMod and required access](https://www.mongodb.com/docs/manual/reference/command/collmod/)
- [MongoDB: mongodump metadata](https://www.mongodb.com/docs/database-tools/mongodump/)
- [Sprint 3 progress](sprint-03-progress.md)
- [Reported live Atlas checks](live-atlas-verification-2026-10-30.md)
