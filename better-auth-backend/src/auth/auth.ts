import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
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
  baseURL: process.env['BETTER_AUTH_URL'],
  basePath: '/auth',
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secondaryStorage,
  session: {
    storeSessionInDatabase: false,
  },
  verification: {
    storeInDatabase: false,
  },
  emailAndPassword: {
    enabled: true,
  },
});
