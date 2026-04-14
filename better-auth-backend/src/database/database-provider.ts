export type DatabaseProvider = 'postgres' | 'mongodb';

type MongoClientLike = {
  db: (name?: string) => unknown;
};

type MongoModuleLike = {
  MongoClient: new (uri: string) => MongoClientLike;
};

const isMongoModuleLike = (value: unknown): value is MongoModuleLike => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (!('MongoClient' in value)) {
    return false;
  }

  const mongoClient = (value as { MongoClient?: unknown }).MongoClient;
  return typeof mongoClient === 'function';
};

const loadMongoModule = (): MongoModuleLike => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mongoModule: unknown = require('mongodb');
  if (!isMongoModuleLike(mongoModule)) {
    throw new Error('Failed to load mongodb module');
  }

  return mongoModule;
};

export const resolveDatabaseProvider = (): DatabaseProvider => {
  const rawProvider = (process.env.DATABASE ?? 'postgres').trim().toLowerCase();

  if (rawProvider === 'postgres' || rawProvider === 'postgresql') {
    return 'postgres';
  }

  if (rawProvider === 'mongodb' || rawProvider === 'mongo') {
    return 'mongodb';
  }

  throw new Error(
    `Unsupported DATABASE value "${process.env.DATABASE}". Use "postgres" or "mongodb".`,
  );
};

export const createMongoDatabase = (
  mongodbUri: string,
): {
  database: unknown;
  client: unknown;
} => {
  const { MongoClient } = loadMongoModule();
  const mongoClient = new MongoClient(mongodbUri);
  const dbName = process.env.MONGODB_DB_NAME?.trim();
  const database = dbName ? mongoClient.db(dbName) : mongoClient.db();

  return {
    database,
    client: mongoClient,
  };
};
