import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import {
  storeInvitation,
  invitationResendEnabled,
  InvitationConflict,
} from '../src/invitation-resend.js';
import { DECLINE_COOLDOWN_MS } from '../src/invitation-cooldown.js';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';
import {
  resendDatabase,
  record,
  first,
  second,
} from '../test-support/resend.js';

const origin = 'http://localhost:5173';
function fresh(reverse = false) {
  return {
    ...record('pending', null),
    senderId: reverse ? second : first,
    recipientId: reverse ? first : second,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

test('resend rollout is off by default and invalid configuration is rejected', () => {
  assert.equal(invitationResendEnabled({}), false);
  assert.equal(
    invitationResendEnabled({ INVITATION_RESEND_ENABLED: 'false' }),
    false,
  );
  assert.equal(
    invitationResendEnabled({ INVITATION_RESEND_ENABLED: 'true' }),
    true,
  );
  assert.throws(() =>
    invitationResendEnabled({ INVITATION_RESEND_ENABLED: 'yes' }),
  );
});

test('new invitation preserves the old decline and supports either direction', async () => {
  for (const reverse of [false, true]) {
    const old = record();
    const f = resendDatabase([old]);
    const next = fresh(reverse);
    await storeInvitation(f.db, next, true);
    assert.equal(f.state.invitations.size, 2);
    assert.deepEqual(f.state.invitations.get(String(old._id)), old);
    assert.equal(
      String(f.state.pairs.get(old.pairKey).invitationId),
      String(next._id),
    );
    assert.equal(f.state.commits, 1);
    assert.equal(f.state.ended, 1);
  }
});

test('cooldown rejects one millisecond before, admits exact deadline, then pending blocks repeats', async (t) => {
  t.mock.timers.enable({
    apis: ['Date'],
    now: Date.parse('2026-11-04T12:00:00Z'),
  });
  const old = record(
    'declined',
    new Date(Date.now() - DECLINE_COOLDOWN_MS + 1),
  );
  const f = resendDatabase([old]);
  await assert.rejects(
    storeInvitation(f.db, fresh(), true),
    (e) => e.code === 'INVITATION_COOLDOWN',
  );
  assert.equal(f.state.invitations.size, 1);
  t.mock.timers.tick(1);
  await storeInvitation(f.db, fresh(), true);
  await assert.rejects(
    storeInvitation(f.db, fresh(), true),
    (e) => e.code === 'INVITATION_ACTIVE',
  );
  assert.equal(f.state.invitations.size, 2);
});

for (const status of ['pending', 'deferred', 'accepted']) {
  test(`${status} prevents new invitations regardless of old timestamps`, async () => {
    const f = resendDatabase([record(status)]);
    await assert.rejects(
      storeInvitation(f.db, fresh(), true),
      InvitationConflict,
    );
    assert.equal(f.state.invitations.size, 1);
  });
}

test('invalid decline date, missing pair pointer, and dangling pointer fail closed', async () => {
  const cases = [
    resendDatabase([record('declined', null)]),
    resendDatabase([record()], { noPairs: true }),
    resendDatabase(),
  ];
  cases[2].state.pairs.set(fresh().pairKey, {
    _id: fresh().pairKey,
    invitationId: new ObjectId(),
  });
  for (const f of cases)
    await assert.rejects(
      storeInvitation(f.db, fresh(), true),
      /administrator review/,
    );
});

test('failure after pointer update rolls back pointer and invitation together', async () => {
  const old = record();
  const f = resendDatabase([old], { insertFailure: true });
  await assert.rejects(storeInvitation(f.db, fresh(), true));
  assert.equal(f.state.invitations.size, 1);
  assert.equal(
    String(f.state.pairs.get(old.pairKey).invitationId),
    String(old._id),
  );
  assert.equal(f.state.rollbacks, 1);
  assert.equal(f.state.ended, 1);
});

test('simulated simultaneous resends and simultaneous first invitations have one winner', async () => {
  for (const initial of [[], [record()]]) {
    const f = resendDatabase(initial);
    const results = await Promise.allSettled([
      storeInvitation(f.db, fresh(), true),
      storeInvitation(f.db, fresh(true), true),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(f.state.invitations.size, initial.length + 1);
  }
});

test('a second decline starts a fresh cooldown without modifying either old record', async (t) => {
  t.mock.timers.enable({
    apis: ['Date'],
    now: Date.parse('2026-11-04T12:00:00Z'),
  });
  const f = resendDatabase([record()]);
  const next = fresh();
  await storeInvitation(f.db, next, true);
  f.state.invitations.set(String(next._id), {
    ...next,
    status: 'declined',
    respondedAt: new Date(),
  });
  t.mock.timers.tick(DECLINE_COOLDOWN_MS - 1);
  await assert.rejects(
    storeInvitation(f.db, fresh(), true),
    InvitationConflict,
  );
  t.mock.timers.tick(1);
  await storeInvitation(f.db, fresh(), true);
  assert.equal(f.state.invitations.size, 3);
});

async function setup(t, initial, options = {}) {
  const f = resendDatabase(initial, options);
  const app = createApp(f.db, {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      req.session = { userId: req.get('X-Test-Account') };
      next();
    },
  });
  app.locals.invitationResendEnabled = true;
  app.locals.logger = { error: (...args) => f.state.logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    ...f,
    request: async (path = '/api/invitations', settings = {}) =>
      fetch(url + path, requestOptions(settings)),
  };
}

function requestOptions(settings) {
  const method = settings.method ?? 'POST';
  return {
    method,
    headers: settings.headers ?? {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-Test-Account': String(first),
    },
    ...(method === 'GET'
      ? {}
      : {
          body:
            settings.body ??
            JSON.stringify({
              recipientId: String(second),
              message: 'Synthetic new invitation',
            }),
        }),
  };
}

test('HTTP resend returns a new invitation; recent decline returns safe cooldown code', async (t) => {
  const f = await setup(t, [record()]);
  const result = await f.request();
  assert.equal(result.status, 201);
  const body = await result.json();
  assert.equal(body.invitation.status, 'pending');
  assert.equal(f.state.invitations.size, 2);
  const recent = await setup(t, [record('declined', new Date())]);
  const blocked = await recent.request();
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).code, 'INVITATION_COOLDOWN');
});

test('HTTP transaction failures are safe; authorization and spoofed fields remain guarded', async (t) => {
  const f = await setup(t, [record()], { pairFailure: true });
  const failed = await f.request();
  assert.equal(failed.status, 503);
  assert.doesNotMatch(
    JSON.stringify([await failed.json(), f.state.logs]),
    /synthetic private/,
  );
  const unauthorized = await f.request('/api/invitations', {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
  });
  assert.equal(unauthorized.status, 401);
  await unauthorized.arrayBuffer();
  const spoofed = await f.request('/api/invitations', {
    body: JSON.stringify({
      recipientId: String(second),
      message: 'Hello',
      pairKey: 'spoof',
    }),
  });
  assert.equal(spoofed.status, 400);
  await spoofed.arrayBuffer();
});

test('API notices follow the current pair and history remains participant-scoped', async (t) => {
  const old = record();
  const f = await setup(t, [old]);
  const before = await f.request('/api/invitations?direction=outgoing', {
    method: 'GET',
  });
  assert.equal(before.status, 200);
  assert.equal(
    (await before.json()).invitations[0].resendPolicy,
    'decline-30-days',
  );
  const next = (await (await f.request()).json()).invitation;
  const after = await f.request('/api/invitations?direction=outgoing', {
    method: 'GET',
  });
  const history = await after.json();
  assert.equal(history.invitations.length, 2);
  assert.equal(
    history.invitations.every((r) => r.resendPolicy === undefined),
    true,
  );
  assert.doesNotMatch(JSON.stringify(history), /pairKey|password|email/);
  const respond = (id) =>
    f.request(`/api/invitations/${id}/response`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'declined' }),
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'X-Test-Account': String(second),
      },
    });
  const declined = await respond(next.id);
  assert.equal(declined.status, 200);
  assert.equal(
    (await declined.json()).invitation.resendPolicy,
    'decline-30-days',
  );
  const replayOld = await respond(String(old._id));
  assert.equal(replayOld.status, 200);
  assert.equal((await replayOld.json()).invitation.resendPolicy, undefined);
  assert.equal(String(f.state.pairs.get(old.pairKey).invitationId), next.id);
});
