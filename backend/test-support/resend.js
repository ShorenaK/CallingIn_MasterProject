import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { invitationPairKey } from '../src/invitation-policy.js';
import {
  pairValidation,
  PAIR_HISTORY_INDEX,
} from '../src/invitation-pair-storage.js';

export const first = new ObjectId('000000000000000000000001');
export const second = new ObjectId('000000000000000000000002');

export function record(
  status = 'declined',
  respondedAt = new Date('2026-01-01T12:00:00Z'),
) {
  return {
    _id: new ObjectId(),
    senderId: first,
    recipientId: second,
    pairKey: invitationPairKey(first, second),
    message: 'Synthetic invitation',
    status,
    respondedAt,
    createdAt: new Date('2025-12-01T00:00:00Z'),
    updatedAt: respondedAt,
  };
}

// Serialized transactions with rollback model the required behavior for HTTP tests.
// They do NOT certify MongoDB write-conflict retries, index behavior or atomicity.
export function resendDatabase(initial = [], options = {}) {
  const state = {
    invitations: new Map(initial.map((r) => [String(r._id), { ...r }])),
    pairs: new Map(
      options.noPairs
        ? []
        : initial.map((r) => [
            r.pairKey,
            { _id: r.pairKey, invitationId: r._id },
          ]),
    ),
    indexes: options.legacy
      ? [{ key: { pairKey: 1 }, unique: true, name: 'invitation_pair_unique' }]
      : [{ key: { pairKey: 1 }, name: PAIR_HISTORY_INDEX }],
    pairOptions: options.noPairs ? null : structuredClone(pairValidation),
    commits: 0,
    rollbacks: 0,
    ended: 0,
    events: [],
    logs: [],
  };
  const collections = {
    users: {
      findOne: async (filter) =>
        options.missingUser ? null : { _id: filter._id },
      find: (filter) => ({
        toArray: async () =>
          filter._id.$in.map((_id) => ({
            _id,
            displayName: 'Synthetic Person',
          })),
      }),
    },
    invitations: invitationCollection(state, options),
    invitationPairs: pairCollection(state, options),
  };
  const db = {
    databaseName: 'resend_test',
    command: async () =>
      options.standalone ? {} : { setName: 'simulated-replica' },
    collection: (name) => collections[name],
    listCollections: () => ({
      next: async () =>
        state.pairOptions ? { options: state.pairOptions } : null,
    }),
    async createCollection(name, settings) {
      assert.equal(name, 'invitationPairs');
      state.pairOptions = settings;
    },
    client: transactionClient(state),
  };
  return { db, state };
}

function transactionClient(state) {
  let queue = Promise.resolve();
  return {
    startSession() {
      const session = {
        active: false,
        async endSession() {
          state.ended += 1;
        },
        async withTransaction(work, settings) {
          assert.equal(settings.readConcern.level, 'snapshot');
          assert.equal(settings.writeConcern.w, 'majority');
          const before = queue;
          let release;
          queue = new Promise((done) => {
            release = done;
          });
          await before;
          session.active = true;
          const invitations = new Map(state.invitations),
            pairs = new Map(state.pairs);
          try {
            await work();
            state.commits += 1;
          } catch (error) {
            state.invitations = invitations;
            state.pairs = pairs;
            state.rollbacks += 1;
            throw error;
          } finally {
            session.active = false;
            release();
          }
        },
      };
      return session;
    },
  };
}

function invitationCollection(state, options) {
  return {
    async findOne(filter, settings) {
      if (settings?.session) assert.equal(settings.session.active, true);
      return (
        [...state.invitations.values()].find((r) => matches(r, filter)) ?? null
      );
    },
    async insertOne(r, settings) {
      assert.equal(settings.session.active, true);
      if (options.insertFailure)
        throw new Error('synthetic private insert failure');
      state.invitations.set(String(r._id), r);
    },
    async findOneAndUpdate(filter, update) {
      const current = state.invitations.get(String(filter._id));
      if (
        !current ||
        !matches(current, filter) ||
        !filter.status.$in.includes(current.status)
      )
        return null;
      const changed = { ...current, ...update.$set };
      state.invitations.set(String(current._id), changed);
      return changed;
    },
    find: (filter) =>
      cursor([...state.invitations.values()].filter((r) => matches(r, filter))),
    listIndexes: () => ({
      toArray: async () => state.indexes.map((index) => ({ ...index })),
    }),
    async createIndex(key, settings) {
      state.events.push('history-index');
      state.indexes.push({ key, ...settings });
    },
    async dropIndex(name) {
      state.events.push('drop-legacy');
      state.indexes = state.indexes.filter((index) => index.name !== name);
    },
  };
}

function pairCollection(state, options) {
  return {
    async findOne(filter, settings) {
      if (settings?.session) assert.equal(settings.session.active, true);
      return state.pairs.get(filter._id) ?? null;
    },
    async updateOne(filter, update, settings) {
      if (settings?.session) assert.equal(settings.session.active, true);
      if (options.pairFailure)
        throw new Error('synthetic private pair failure');
      const current = state.pairs.get(filter._id);
      if (
        current &&
        filter.invitationId &&
        !current.invitationId.equals(filter.invitationId)
      )
        throw Object.assign(new Error('synthetic duplicate pointer'), {
          code: 11000,
        });
      state.pairs.set(filter._id, {
        _id: filter._id,
        ...(current ?? update.$setOnInsert),
        ...update.$set,
      });
    },
    find: (filter) =>
      cursor(
        [...state.pairs.values()].filter(
          (r) => !filter._id || filter._id.$in.includes(r._id),
        ),
      ),
  };
}

function matches(r, filter) {
  return (
    (!filter._id || r._id.equals(filter._id)) &&
    (!filter.pairKey || r.pairKey === filter.pairKey) &&
    (!filter.senderId || r.senderId.equals(filter.senderId)) &&
    (!filter.recipientId || r.recipientId.equals(filter.recipientId))
  );
}

function cursor(records) {
  let limit = Infinity;
  return {
    sort() {
      return this;
    },
    limit(value) {
      limit = value;
      return this;
    },
    toArray: async () => records.slice(0, limit),
    async *[Symbol.asyncIterator]() {
      yield* records;
    },
  };
}
