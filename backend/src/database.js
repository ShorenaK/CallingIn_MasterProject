import { MongoClient } from 'mongodb';

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

  let client;
  try {
    client = createClient(uri);
    await client.connect();
    const db = client.db(name);
    await db.command({ ping: 1 });
    return { db, close: () => client.close() };
  } catch {
    await client?.close().catch(() => {});
    throw new Error(
      'MongoDB connection failed. Check credentials, Atlas IP access, and network connectivity.',
    );
  }
}
