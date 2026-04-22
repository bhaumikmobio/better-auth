import { Db, MongoClient } from 'mongodb';

const resolveDbNameFromUri = (mongodbUri: string): string | null => {
  try {
    const parsed = new URL(mongodbUri);
    const fromPath = parsed.pathname.replace(/^\//, '').trim();
    if (fromPath.length > 0) {
      return decodeURIComponent(fromPath);
    }
    return null;
  } catch {
    return null;
  }
};

export const createMongoDatabase = (
  mongodbUri: string,
): { client: MongoClient; database: Db } => {
  const client = new MongoClient(mongodbUri);
  const configuredDbName = process.env.MONGODB_DB_NAME?.trim();
  const dbName = configuredDbName || resolveDbNameFromUri(mongodbUri);
  return {
    client,
    database: client.db(dbName || 'betterAuth'),
  };
};
