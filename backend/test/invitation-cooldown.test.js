import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DECLINE_COOLDOWN_MS,
  declineRetryAt,
  hasDeclineCooldownElapsed,
} from '../src/invitation-cooldown.js';

const declined = (time) => ({
  status: 'declined',
  respondedAt: new Date(time),
});

test('cooldown starts at decline, ignoring invitation send and prior update times', () => {
  const record = {
    ...declined('2026-11-04T15:30:00.000Z'),
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  };
  assert.equal(
    declineRetryAt(record).toISOString(),
    '2026-12-04T15:30:00.000Z',
  );
  assert.equal(hasDeclineCooldownElapsed(record, record.respondedAt), false);
});

test('one millisecond before is blocked; the exact deadline and later have elapsed', () => {
  const record = declined('2026-11-04T15:30:00.000Z');
  const deadline = Date.parse('2026-12-04T15:30:00.000Z');
  assert.equal(
    hasDeclineCooldownElapsed(record, new Date(deadline - 1)),
    false,
  );
  assert.equal(hasDeclineCooldownElapsed(record, new Date(deadline)), true);
  assert.equal(hasDeclineCooldownElapsed(record, new Date(deadline + 1)), true);
});

test('pending, Maybe Later and accepted invitations never qualify by elapsed time', () => {
  for (const status of ['pending', 'deferred', 'accepted']) {
    const record = { status, respondedAt: new Date('2020-01-01T00:00:00Z') };
    assert.equal(declineRetryAt(record), null);
    assert.equal(
      hasDeclineCooldownElapsed(record, new Date('2030-01-01T00:00:00Z')),
      false,
    );
  }
});

test('missing, invalid, wrongly typed or overflowing decline times fail closed', () => {
  for (const respondedAt of [
    null,
    undefined,
    '2026-11-04T12:00:00Z',
    0,
    new Date(NaN),
    new Date(8.64e15),
  ]) {
    const record = { status: 'declined', respondedAt };
    assert.equal(declineRetryAt(record), null);
    assert.equal(hasDeclineCooldownElapsed(record), false);
  }
});

test('invalid clocks and clocks before the decline cannot qualify', () => {
  const record = declined('2026-11-04T12:00:00Z');
  for (const now of [
    new Date(NaN),
    null,
    '2030-01-01T00:00:00Z',
    new Date('2026-11-03T12:00:00Z'),
  ])
    assert.equal(hasDeclineCooldownElapsed(record, now), false);
});

test('thirty elapsed days crosses month, leap-day and DST boundaries without calendar adjustment', () => {
  for (const [start, end] of [
    ['2026-01-31T12:00:00Z', '2026-03-02T12:00:00.000Z'],
    ['2028-02-28T12:00:00Z', '2028-03-29T12:00:00.000Z'],
    ['2026-10-15T10:00:00-04:00', '2026-11-14T14:00:00.000Z'],
    ['2026-02-20T10:00:00-05:00', '2026-03-22T15:00:00.000Z'],
  ]) {
    const record = declined(start);
    const deadline = declineRetryAt(record);
    assert.equal(deadline.toISOString(), end);
    assert.equal(
      deadline.getTime() - record.respondedAt.getTime(),
      DECLINE_COOLDOWN_MS,
    );
  }
});

test('calculations do not mutate or share a date object with the stored decline', () => {
  const record = declined('2026-11-04T12:00:00Z');
  const before = record.respondedAt.getTime();
  const first = declineRetryAt(record);
  first.setTime(0);
  assert.equal(record.respondedAt.getTime(), before);
  assert.equal(declineRetryAt(record).getTime(), before + DECLINE_COOLDOWN_MS);
});

test('the default clock uses server time at the exact boundary', (t) => {
  t.mock.timers.enable({ apis: ['Date'] });
  const record = {
    status: 'declined',
    respondedAt: new Date(Date.now() - DECLINE_COOLDOWN_MS + 1),
  };
  assert.equal(hasDeclineCooldownElapsed(record), false);
  t.mock.timers.tick(1);
  assert.equal(hasDeclineCooldownElapsed(record), true);
});
