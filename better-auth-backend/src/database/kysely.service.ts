import { Kysely, MysqlDialect } from 'kysely';
import mysql from 'mysql2';
import { getRequiredEnv } from '../common/utils/env.util';

let mysqlDb: Kysely<unknown> | null = null;

const getRequiredDatabaseEnv = (name: string): string =>
  getRequiredEnv(name, {
    trim: true,
    errorMessage: `${name} is required for selected DATABASE provider`,
  });

const getPort = (value: string, envName: string): number => {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${envName} must be a valid positive integer`);
  }

  return port;
};

export const getMysqlKysely = (): Kysely<unknown> => {
  if (!mysqlDb) {
    const host = getRequiredDatabaseEnv('DB_HOST');
    const user = getRequiredDatabaseEnv('DB_USER');
    const password = getRequiredDatabaseEnv('DB_PASSWORD');
    const database = getRequiredDatabaseEnv('DB_NAME');
    const port = getPort(getRequiredDatabaseEnv('DB_PORT'), 'DB_PORT');

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
