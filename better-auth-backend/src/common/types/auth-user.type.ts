export const APP_ROLES = ['user', 'admin'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AuthenticatedUser = {
  id: string;
  role?: string;
  email?: string | null;
  name?: string | null;
  [key: string]: unknown;
};
