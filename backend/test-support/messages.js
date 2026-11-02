import assert from 'node:assert/strict';

// Simulates query behavior for HTTP tests; not proof of MongoDB validation.
export function messageStorage(state, options = {}) {
  return {
    createIndex: async () => {},
    async insertOne(record) {
      if (options.writeFailure) throw new Error('private message failure');
      state.messages.push({ ...record });
      return { insertedId: record._id };
    },
    find(filter, settings) {
      state.queries?.push(filter);
      assert.deepEqual(settings.projection, {
        _id: 1,
        conversationId: 1,
        senderId: 1,
        text: 1,
        createdAt: 1,
      });
      const records = state.messages.filter((record) =>
        matches(record, filter),
      );
      return {
        sort(order) {
          assert.deepEqual(order, { createdAt: -1, _id: -1 });
          records.sort(
            (a, b) =>
              b.createdAt - a.createdAt ||
              String(b._id).localeCompare(String(a._id)),
          );
          return this;
        },
        limit(size) {
          state.pageLimit = size;
          this.size = size;
          return this;
        },
        async toArray() {
          if (options.listFailure) throw new Error('private history failure');
          return records.slice(0, this.size);
        },
      };
    },
  };
}

function matches(record, filter) {
  if (!record.conversationId.equals(filter.conversationId)) return false;
  if (!filter.$or) return true;
  const [older, tied] = filter.$or;
  return (
    record.createdAt < older.createdAt.$lt ||
    (+record.createdAt === +tied.createdAt &&
      String(record._id) < String(tied._id.$lt))
  );
}
