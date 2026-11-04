import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import {
  inspectResendMigration,
  applyResendMigration,
} from '../src/invitation-resend-migration.js';
import {
  verifyResendStorage,
  currentDeclineIds,
  pairValidation,
} from '../src/invitation-pair-storage.js';
import { resendDatabase, record } from '../test-support/resend.js';

const approval = {
  database: 'resend_test',
  writersStopped: true,
  backupReference: 'synthetic backup acknowledgment',
};
const legacy = (records = [record()], options = {}) =>
  resendDatabase(records, { legacy: true, noPairs: true, ...options });

test('read-only inspection produces a plan without writing or returning invitation content', async () => {
  const old = record();
  const f = legacy([old]);
  const plan = await inspectResendMigration(f.db);
  assert.equal(plan.pairs.size, 1);
  assert.equal(plan.legacyIndex, 'invitation_pair_unique');
  assert.equal(f.state.pairs.size, 0);
  assert.equal(f.state.pairOptions, null);
  assert.deepEqual(f.state.events, []);
  assert.doesNotMatch(JSON.stringify(plan), /Synthetic invitation/);
});

test('a standalone database is rejected before any migration writes', async () => {
  const f = legacy([record()], { standalone: true });
  await assert.rejects(
    applyResendMigration(f.db, approval),
    /replica set or sharded/,
  );
  assert.equal(f.state.pairOptions, null);
  assert.deepEqual(f.state.events, []);
});

test('migration preserves records, backfills pointers and drops the legacy index last', async () => {
  const old = record();
  const f = legacy([old]);
  assert.deepEqual(await applyResendMigration(f.db, approval), {
    migratedPairs: 1,
  });
  assert.deepEqual(f.state.invitations.get(String(old._id)), old);
  assert.equal(
    String(f.state.pairs.get(old.pairKey).invitationId),
    String(old._id),
  );
  assert.deepEqual(f.state.events, ['history-index', 'drop-legacy']);
  await verifyResendStorage(f.db);
});

test('migration requires exact target, stopped writers and backup acknowledgment before any write', async () => {
  for (const changed of [
    { database: 'wrong' },
    { writersStopped: false },
    { backupReference: ' ' },
  ]) {
    const f = legacy();
    await assert.rejects(
      applyResendMigration(f.db, { ...approval, ...changed }),
      /acknowledgments/,
    );
    assert.equal(f.state.pairs.size, 0);
    assert.deepEqual(f.state.events, []);
  }
});

test('duplicate pairs and unusable decline dates stop before changing indexes', async () => {
  for (const records of [
    [record(), record()],
    [record('declined', null)],
    [{ ...record(), pairKey: 'invalid' }],
  ]) {
    const f = legacy(records);
    await assert.rejects(applyResendMigration(f.db, approval));
    assert.deepEqual(f.state.events, []);
    assert.equal(f.state.pairOptions, null);
  }
});

test('missing legacy index requires explicit administrator review, not a destructive rerun', async () => {
  const f = resendDatabase([record()]);
  await assert.rejects(
    applyResendMigration(f.db, approval),
    /legacy permanent pair index/,
  );
  assert.deepEqual(f.state.events, []);
});

test('backfill failure keeps legacy uniqueness; partial correct backfill can resume', async () => {
  const failed = legacy([record()], { pairFailure: true });
  await assert.rejects(applyResendMigration(failed.db, approval));
  assert.equal(failed.state.indexes[0].unique, true);
  assert.deepEqual(failed.state.events, []);
  const old = record();
  const resumed = legacy([old]);
  resumed.state.pairOptions = structuredClone(pairValidation);
  resumed.state.pairs.set(old.pairKey, {
    _id: old.pairKey,
    invitationId: old._id,
  });
  await applyResendMigration(resumed.db, approval);
  assert.equal(resumed.state.pairs.size, 1);
});

test('conflicting or extra pair pointers and weak validators stop before legacy removal', async () => {
  for (const mutate of [
    (f, old) =>
      f.state.pairs.set(old.pairKey, {
        _id: old.pairKey,
        invitationId: new ObjectId(),
      }),
    (f) =>
      f.state.pairs.set('extra', {
        _id: 'extra',
        invitationId: new ObjectId(),
      }),
    (f) => {
      f.state.pairOptions.validationAction = 'warn';
    },
  ]) {
    const old = record();
    const f = legacy([old]);
    f.state.pairOptions = structuredClone(pairValidation);
    mutate(f, old);
    await assert.rejects(applyResendMigration(f.db, approval));
    assert.equal(f.state.indexes[0].unique, true);
    assert.deepEqual(f.state.events, []);
  }
});

test('enabled startup requires completed migration and never drops an index automatically', async () => {
  const missing = legacy();
  await assert.rejects(verifyResendStorage(missing.db), /migration/);
  const old = resendDatabase([record()], { legacy: true });
  await assert.rejects(verifyResendStorage(old.db), /indexes/);
  assert.deepEqual(old.state.events, []);
  const weak = resendDatabase();
  weak.state.pairOptions.validationLevel = 'moderate';
  await assert.rejects(verifyResendStorage(weak.db), /migration/);
  await verifyResendStorage(resendDatabase().db);
});

test('resend notice is only marked on the current valid decline, and never when disabled', async () => {
  const old = record(),
    current = record();
  const f = resendDatabase([old, current]);
  assert.deepEqual(
    await currentDeclineIds(f.db, [old, current], true),
    new Set([String(current._id)]),
  );
  assert.deepEqual(
    await currentDeclineIds(f.db, [old, current], false),
    new Set(),
  );
  const bad = record('declined', null);
  const g = resendDatabase([bad]);
  assert.deepEqual(await currentDeclineIds(g.db, [bad], true), new Set());
});
