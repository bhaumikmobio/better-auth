import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { prisma } from '../../database/prisma.service';

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required');
}

export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/auth',
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
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
