import type { AuthenticatedUser } from '../common/types/auth-user.type';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
