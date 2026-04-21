import 'dotenv/config';
import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import { Pool } from 'pg';
import {
  resolveDatabaseProvider,
  type DatabaseProvider,
} from '../src/database/database-provider';
import { getRequiredEnv } from '../src/database/common.util';

type UserRecord = {
  id: string;
  role: string | null;
};

type AuthModule = {
  auth: {
    api: AuthApi;
  };
};

type AuthApi = {
  signUpEmail?: (args: {
    body: {
      email: string;
      password: string;
      name: string;
    };
  }) => Promise<unknown>;
};

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
const DEFAULT_ADMIN_NAME = 'Admin';

const normalizeProvider = (value: string): DatabaseProvider => {
  const raw = value.trim().toLowerCase();

  if (raw === 'postgres' || raw === 'postgresql') {
    return 'postgres';
  }
  if (raw === 'mysql') {
    return 'mysql';
  }
  if (raw === 'mongodb' || raw === 'mongo') {
    return 'mongodb';
  }

  throw new Error(
    `Unsupported database "${value}". Use postgres, mysql, or mongodb.`,
  );
};

const getErrorText = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
};

const isAlreadyExistsError = (error: unknown): boolean => {
  const message = getErrorText(error).toLowerCase();
  return (
    message.includes('already exists') ||
    message.includes('user already exists') ||
    message.includes('user_already_exists')
  );
};

const getAdminEmail = (): string =>
  process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;

const getAdminPassword = (): string =>
  process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;

const getAdminName = (): string =>
  process.env.ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME;

const getAuthApi = (): AuthApi => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const authModule = require('../src/modules/auth/auth.config') as AuthModule;
  return authModule.auth.api;
};

const createAdminUserIfMissing = async (): Promise<void> => {
  const authApi = getAuthApi();
  if (!authApi.signUpEmail) {
    throw new Error('Better Auth signUpEmail API is not available.');
  }

  const email = getAdminEmail();
  try {
    await authApi.signUpEmail({
      body: {
        email,
        password: getAdminPassword(),
        name: getAdminName(),
      },
    });
    console.info(`Created admin user ${email}.`);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
    console.info(`Admin user ${email} already exists.`);
  }
};

const findUserByEmailPostgres = async (
  email: string,
): Promise<UserRecord | null> => {
  const connectionString = getRequiredEnv('POSTGRES_URL', {
    trim: true,
    errorMessage: 'POSTGRES_URL is required when DATABASE=postgres',
  });

  const pool = new Pool({ connectionString });

  try {
    const result = await pool.query<{ id: string; role: string | null }>(
      'SELECT id, role FROM "user" WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
};

const setAdminRolePostgres = async (userId: string): Promise<void> => {
  const connectionString = getRequiredEnv('POSTGRES_URL', {
    trim: true,
    errorMessage: 'POSTGRES_URL is required when DATABASE=postgres',
  });

  const pool = new Pool({ connectionString });

  try {
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [
      'admin',
      userId,
    ]);
  } finally {
    await pool.end();
  }
};

const createMysqlPool = () =>
  mysql.createPool({
    host: getRequiredEnv('DB_HOST', {
      trim: true,
      errorMessage: 'DB_HOST is required when DATABASE=mysql',
    }),
    user: getRequiredEnv('DB_USER', {
      trim: true,
      errorMessage: 'DB_USER is required when DATABASE=mysql',
    }),
    password: getRequiredEnv('DB_PASSWORD', {
      trim: true,
      errorMessage: 'DB_PASSWORD is required when DATABASE=mysql',
    }),
    database: getRequiredEnv('DB_NAME', {
      trim: true,
      errorMessage: 'DB_NAME is required when DATABASE=mysql',
    }),
    port: Number(
      getRequiredEnv('DB_PORT', {
        trim: true,
        errorMessage: 'DB_PORT is required when DATABASE=mysql',
      }),
    ),
  });

type MysqlUserRow = RowDataPacket & {
  id: string;
  role: string | null;
};

const findUserByEmailMysql = async (
  email: string,
): Promise<UserRecord | null> => {
  const pool = createMysqlPool();

  try {
    const [rows] = await pool.query<MysqlUserRow[]>(
      'SELECT id, role FROM `user` WHERE email = ? LIMIT 1',
      [email],
    );
    return rows[0] ?? null;
  } finally {
    await pool.end();
  }
};

const setAdminRoleMysql = async (userId: string): Promise<void> => {
  const pool = createMysqlPool();

  try {
    await pool.query('UPDATE `user` SET role = ? WHERE id = ?', [
      'admin',
      userId,
    ]);
  } finally {
    await pool.end();
  }
};

const createMongoClient = (): MongoClient => {
  const mongodbUri = getRequiredEnv('MONGODB_URI', {
    trim: true,
    errorMessage: 'MONGODB_URI is required when DATABASE=mongodb',
  });

  return new MongoClient(mongodbUri);
};

const getMongoDbName = (): string | undefined =>
  process.env.MONGODB_DB_NAME?.trim();

const findUserByEmailMongo = async (
  email: string,
): Promise<UserRecord | null> => {
  const client = createMongoClient();

  try {
    await client.connect();
    const dbName = getMongoDbName();
    const db = dbName ? client.db(dbName) : client.db();
    const user = await db
      .collection<{ id: string; role?: string | null }>('user')
      .findOne({ email }, { projection: { id: 1, role: 1 } });

    if (!user?.id) {
      return null;
    }

    return { id: user.id, role: user.role ?? null };
  } finally {
    await client.close();
  }
};

const setAdminRoleMongo = async (userId: string): Promise<void> => {
  const client = createMongoClient();

  try {
    await client.connect();
    const dbName = getMongoDbName();
    const db = dbName ? client.db(dbName) : client.db();
    await db
      .collection('user')
      .updateOne({ id: userId }, { $set: { role: 'admin' } });
  } finally {
    await client.close();
  }
};

const findUserByEmail = async (
  provider: DatabaseProvider,
  email: string,
): Promise<UserRecord | null> => {
  if (provider === 'postgres') {
    return findUserByEmailPostgres(email);
  }
  if (provider === 'mysql') {
    return findUserByEmailMysql(email);
  }
  return findUserByEmailMongo(email);
};

const setAdminRole = async (
  provider: DatabaseProvider,
  userId: string,
): Promise<void> => {
  if (provider === 'postgres') {
    await setAdminRolePostgres(userId);
    return;
  }
  if (provider === 'mysql') {
    await setAdminRoleMysql(userId);
    return;
  }
  await setAdminRoleMongo(userId);
};

const run = async (): Promise<void> => {
  const providerArg = process.argv[2];
  if (providerArg) {
    process.env.DATABASE = normalizeProvider(providerArg);
  }

  const provider = resolveDatabaseProvider();
  const email = getAdminEmail();

  await createAdminUserIfMissing();

  const user = await findUserByEmail(provider, email);
  if (!user) {
    throw new Error(`Failed to resolve user id for ${email}.`);
  }

  if (user.role !== 'admin') {
    await setAdminRole(provider, user.id);
    console.info(`Updated role to admin for ${email}.`);
  } else {
    console.info(`Role is already admin for ${email}.`);
  }

  console.info(`Admin seed completed for ${provider}.`);
};

run().catch((error: unknown) => {
  console.error(`Admin seed failed: ${getErrorText(error)}`);
  process.exitCode = 1;
});
