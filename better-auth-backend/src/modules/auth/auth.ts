import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required');
}

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();
const secondaryStorage = {
  get(key: string) {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key: string, value: string, ttl?: number) {
    memoryStore.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  },
  delete(key: string) {
    memoryStore.delete(key);
  },
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env['BETTER_AUTH_URL'],
  basePath: '/auth',
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secondaryStorage,
  session: {
    storeSessionInDatabase: true,
  },
  verification: {
    storeInDatabase: true,
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
