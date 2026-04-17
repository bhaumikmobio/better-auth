import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { auth } from '../modules/auth/auth.config';
import type { AppRole } from '../common/types/auth-user.type';

export type AdminUserStatus = 'active' | 'inactive';

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminUserStatus;
};

export type ListUsersOptions = {
  limit: number;
  offset: number;
};

type BetterAuthListUsersResult = {
  users?: unknown;
  total?: unknown;
  data?: {
    users?: unknown;
    total?: unknown;
  };
};

const FALLBACK_NAME = 'Unknown user';
const FALLBACK_EMAIL = 'unknown@example.com';

const getStringValue = (
  source: Record<string, unknown>,
  key: string,
  fallback: string,
): string => {
  const value = source[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
};

const toStatus = (source: Record<string, unknown>): AdminUserStatus => {
  const banned = source.banned;
  return banned === true ? 'inactive' : 'active';
};

const toAdminUserListItem = (value: unknown): AdminUserListItem | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const id = getStringValue(source, 'id', '');
  if (!id) {
    return null;
  }

  return {
    id,
    name: getStringValue(source, 'name', FALLBACK_NAME),
    email: getStringValue(source, 'email', FALLBACK_EMAIL),
    role: getStringValue(source, 'role', 'user'),
    status: toStatus(source),
  };
};

@Injectable()
export class AdminService {
  async setUserRole(
    userId: string,
    role: AppRole,
    requestHeaders: IncomingHttpHeaders,
  ) {
    // Forward caller headers so Better Auth can validate admin privileges.
    return auth.api.setRole({
      headers: fromNodeHeaders(requestHeaders),
      body: {
        userId,
        role,
      },
    });
  }

  async listUsers(
    requestHeaders: IncomingHttpHeaders,
    options: ListUsersOptions,
  ): Promise<{ users: AdminUserListItem[]; total: number }> {
    const adminApi = auth.api as {
      listUsers?: (args: {
        headers: Headers;
        query: { limit: number; offset: number };
      }) => Promise<unknown>;
    };

    if (!adminApi.listUsers) {
      throw new InternalServerErrorException(
        'Admin users listing is not available in the auth configuration.',
      );
    }

    const result = (await adminApi.listUsers({
      headers: fromNodeHeaders(requestHeaders),
      query: {
        limit: options.limit,
        offset: options.offset,
      },
    })) as BetterAuthListUsersResult;

    const usersRaw = Array.isArray(result.users)
      ? result.users
      : Array.isArray(result.data?.users)
        ? result.data?.users
        : [];

    const users = usersRaw
      .map(toAdminUserListItem)
      .filter((item): item is AdminUserListItem => item !== null);

    const totalValue =
      typeof result.total === 'number'
        ? result.total
        : typeof result.data?.total === 'number'
          ? result.data.total
          : users.length;

    return {
      users,
      total: totalValue,
    };
  }
}
