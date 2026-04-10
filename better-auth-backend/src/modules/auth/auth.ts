import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const auth = betterAuth({
  baseURL: process.env['BETTER_AUTH_URL'],
  basePath: '/auth',
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
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
