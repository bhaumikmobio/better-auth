import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import {
  createMongoDatabase,
  resolveDatabaseProvider,
} from '../../database/database-provider';
import { getPrismaClient } from '../../database/prisma.service';

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required');
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

const databaseProvider = resolveDatabaseProvider();

const getDatabaseAdapter = (): unknown => {
  if (databaseProvider === 'postgres') {
    return prismaAdapter(getPrismaClient(), {
      provider: 'postgresql',
    });
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required when DATABASE=mongodb');
  }

  const { database, client } = createMongoDatabase(mongodbUri);

  return mongodbAdapter(database as never, {
    client: client as never,
    transaction: false,
  });
};

export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/auth',
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
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
      // Email sending is intentionally not implemented yet.
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
