import { prismaAdapter } from '@better-auth/prisma-adapter';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { MONGODB_URI_REQUIRED_MESSAGE } from '../common/constants/app.constants';
import { getRequiredEnv } from '../common/utils/env.util';
import {
  createMongoDatabase,
  resolveDatabaseProvider,
} from '../database/database.service';
import { getMysqlKysely } from '../database/kysely.service';
import { getPrismaClient } from '../database/prisma/prisma.service';

const authSecret = getRequiredEnv('BETTER_AUTH_SECRET');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

const databaseProvider = resolveDatabaseProvider();

const getDatabaseAdapter = (): unknown => {
  switch (databaseProvider) {
    case 'postgres':
      return prismaAdapter(getPrismaClient(), {
        provider: 'postgresql',
      });
    case 'mysql':
      return {
        db: getMysqlKysely(),
        type: 'mysql',
      };
    default: {
      const mongodbUri = getRequiredEnv('MONGODB_URI', {
        errorMessage: MONGODB_URI_REQUIRED_MESSAGE,
      });
      const { database, client } = createMongoDatabase(mongodbUri);

      return mongodbAdapter(database as never, {
        client: client as never,
        transaction: false,
      });
    }
  }
};

const normalizeOrigin = (value: string): string => value.replace(/\/$/, '');

const collectTrustedOrigins = (): string[] => {
  const extras =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((s) => s.trim()) ??
    [];
  const merged = [
    process.env.FRONTEND_URL?.trim(),
    process.env.BETTER_AUTH_URL?.trim(),
    ...extras,
  ].filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
  const normalized = merged.map(normalizeOrigin);
  return Array.from(new Set(normalized));
};

const resolvedTrustedOrigins = collectTrustedOrigins();
const trustedOrigins =
  resolvedTrustedOrigins.length > 0
    ? resolvedTrustedOrigins
    : ['http://localhost:3000'];

const betterAuthUrl = getRequiredEnv('BETTER_AUTH_URL', { trim: true });

export const auth = betterAuth({
  secret: authSecret,
  baseURL: normalizeOrigin(betterAuthUrl),
  basePath: '/auth',
  trustedOrigins,
  database: getDatabaseAdapter() as never,
  session: {
    storeSessionInDatabase: true,
  },
  verification: {
    storeInDatabase: true,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      prompt: 'select_account',
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: ({ user, url }) => {
      console.info(
        `Password reset requested for ${user.email}. Reset URL: ${url}`,
      );
      return Promise.resolve();
    },
    onPasswordReset: ({ user }) => {
      console.info(`Password reset completed for ${user.email}`);
      return Promise.resolve();
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
    }),
  ],
});
