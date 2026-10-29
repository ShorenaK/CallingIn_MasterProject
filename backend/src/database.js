import { MongoClient } from 'mongodb';

/**
 * @typedef {{db: import('mongodb').Db, close: () => Promise<void>}} DatabaseConnection
 */

/**
 * @param {Record<string, string | undefined>} [env]
 * @param {(uri: string) => MongoClient} [createClient]
 * @returns {Promise<DatabaseConnection>}
 */
export async function connectDatabase(
  env = process.env,
  createClient = (uri) =>
    new MongoClient(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 }),
) {
  const uri = env.MONGODB_URI?.trim();
  const name = env.MONGODB_DB_NAME?.trim();
  if (!uri || !name || /<[^>]+>/.test(uri)) {
    throw new Error('Set MONGODB_URI and MONGODB_DB_NAME in backend/.env.');
  }

  /** @type {MongoClient | undefined} */
  let client;
  try {
    client = createClient(uri);
    await client.connect();
    const db = client.db(name);
    await db.command({ ping: 1 });
    const connectedClient = client;
    return { db, close: () => connectedClient.close() };
  } catch {
    await client?.close().catch(() => {});
    throw new Error(
      'MongoDB connection failed. Check credentials, Atlas IP access, and network connectivity.',
    );
  }
}
