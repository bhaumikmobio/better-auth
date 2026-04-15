import { Kysely, MysqlDialect } from 'kysely';
import mysql from 'mysql2';

let mysqlDb: Kysely<unknown> | null = null;

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for selected DATABASE provider`);
  }

  return value;
};

const getPort = (value: string, envName: string): number => {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${envName} must be a valid positive integer`);
  }

  return port;
};

export const getMysqlKysely = (): Kysely<unknown> => {
  if (!mysqlDb) {
    const host = getRequiredEnv('DB_HOST');
    const user = getRequiredEnv('DB_USER');
    const password = getRequiredEnv('DB_PASSWORD');
    const database = getRequiredEnv('DB_NAME');
    const port = getPort(getRequiredEnv('DB_PORT'), 'DB_PORT');

    mysqlDb = new Kysely({
      dialect: new MysqlDialect({
        pool: mysql.createPool({
          host,
          user,
          password,
          database,
          port,
        }),
      }),
    });
  }

  return mysqlDb;
};
