import { APP_ROLES } from '../types/auth-user.type';

/** User-facing and log messages for admin domain (Nest admin module). */
export const ADMIN_MESSAGES = {
  DASHBOARD_DATA: 'Admin dashboard data',
  PROFILE: 'Authenticated user profile',
  USERS_FETCHED: 'Admin users fetched successfully.',
  USER_CREATED: 'User created successfully.',
  USER_UPDATED: 'User updated successfully.',
  USER_DELETED: 'User deleted successfully.',
  /** Service-layer errors (Better Auth / business rules). */
  SERVICE: {
    REMOVE_SELF_FORBIDDEN: 'You cannot delete your own account.',
    REMOVE_ADMIN_FORBIDDEN:
      'Admin users cannot be deleted through this endpoint.',
    LIST_USERS_UNAVAILABLE:
      'Admin users listing is not available in the auth configuration.',
    UPDATE_USER_UNAVAILABLE:
      'Admin user update is not available in the auth configuration.',
    REMOVE_USER_UNAVAILABLE:
      'Admin user removal is not available in the auth configuration.',
    CREATE_USER_UNAVAILABLE:
      'Admin user creation is not available in the auth configuration.',
  },
  VALIDATION: {
    FIELD_MUST_BE_INTEGER: (fieldName: string) =>
      `${fieldName} must be an integer.`,
    FIELD_MUST_BE_BETWEEN: (fieldName: string, min: number, max: number) =>
      `${fieldName} must be between ${min} and ${max}.`,
    NAME_NON_EMPTY: 'name must be a non-empty string.',
    EMAIL_NON_EMPTY: 'email must be a non-empty string.',
    INVALID_ROLE: `Invalid role. Allowed values: ${APP_ROLES.join(', ')}`,
    AT_LEAST_ONE_FIELD: 'Provide at least one of: name, email, or role.',
    UNABLE_TO_RESOLVE_CURRENT_USER: 'Unable to resolve current user.',
    PASSWORD_REQUIRED: 'password is required.',
    PASSWORD_MIN_LENGTH: (min: number) =>
      `password must be at least ${min} characters.`,
  },
} as const;

/** Matches frontend password policy minimum for admin-created accounts. */
export const ADMIN_PASSWORD_MIN_LENGTH = 8;

/** Query defaults for `GET /admin/users` (limit/offset). */
export const ADMIN_USER_LIST_QUERY = {
  DEFAULT_LIMIT: 50,
  MIN_LIMIT: 1,
  MAX_LIMIT: 200,
  DEFAULT_OFFSET: 0,
  MIN_OFFSET: 0,
} as const;
