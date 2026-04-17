import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import {
  createMongoDatabase,
  resolveDatabaseProvider,
} from '../../database/database-provider';
import { getRequiredEnv } from '../../database/common.util';
import { getMysqlKysely } from '../../database/kysely.service';
import { getPrismaClient } from '../../database/prisma.service';

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
        errorMessage: 'MONGODB_URI is required when DATABASE=mongodb',
      });
      const { database, client } = createMongoDatabase(mongodbUri);

      return mongodbAdapter(database as never, {
        client: client as never,
        transaction: false,
      });
    }
  }
};

const frontendOrigin =
  process.env.FRONTEND_URL?.trim() ?? 'http://localhost:3000';
const trustedOrigins = [frontendOrigin];

export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL,
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
      // Email sending is intentionally not implemented yet will be implemented in the future.
      // This log confirms reset flow and provides the URL in development.
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
});
