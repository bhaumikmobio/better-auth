export type DatabaseProvider = 'postgres' | 'mongodb' | 'mysql';

const DEFAULT_DATABASE_PROVIDER: DatabaseProvider = 'postgres';

export const resolveDatabaseProvider = (): DatabaseProvider => {
  const value = process.env.DATABASE?.trim().toLowerCase();

  if (!value) {
    return DEFAULT_DATABASE_PROVIDER;
  }

  if (value === 'postgres' || value === 'mongodb' || value === 'mysql') {
    return value;
  }

  throw new Error('DATABASE must be one of: postgres, mongodb, mysql');
};
