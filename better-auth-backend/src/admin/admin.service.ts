import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { ADMIN_MESSAGES } from '../common/constants/admin.constants';
import type { AppRole } from '../common/types/auth-user.type';
import { auth } from '../modules/auth/auth.config';
import type { CreateAdminUserDto } from './dto/create-admin-user.dto';
import type { UpdateAdminUserDto } from './dto/update-admin-user.dto';

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

type BetterAuthGetUserResult = {
  user?: {
    role?: unknown;
  };
  role?: unknown;
};

const FALLBACK_NAME = 'Unknown user';
const FALLBACK_EMAIL = 'unknown@example.com';
const ROLE_LOOKUP_PAGE_SIZE = 200;

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

const roleContainsAdmin = (role: string | undefined | null): boolean => {
  if (!role) {
    return false;
  }
  return role
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes('admin');
};

const unwrapCreateUserPayload = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }
  const root = raw as Record<string, unknown>;
  if (root.user && typeof root.user === 'object') {
    return root.user;
  }
  if (root.data && typeof root.data === 'object') {
    return root.data;
  }
  return raw;
};

const extractRoleFromGetUser = (
  raw: BetterAuthGetUserResult,
): string | undefined => {
  const fromNested = raw.user?.role;
  if (typeof fromNested === 'string') {
    return fromNested;
  }

  const fromRoot = raw.role;
  return typeof fromRoot === 'string' ? fromRoot : undefined;
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
  private getAdminApi() {
    return auth.api as {
      getUser?: (args: {
        headers: Headers;
        query: { id: string };
      }) => Promise<unknown>;
      listUsers?: (args: {
        headers: Headers;
        query: { limit: number; offset: number };
      }) => Promise<unknown>;
      createUser?: (args: {
        headers: Headers;
        body: {
          email: string;
          password: string;
          name: string;
          role: string;
        };
      }) => Promise<unknown>;
      adminUpdateUser?: (args: {
        headers: Headers;
        body: { userId: string; data: Record<string, string> };
      }) => Promise<unknown>;
      removeUser?: (args: {
        headers: Headers;
        body: { userId: string };
      }) => Promise<unknown>;
      setRole: (args: {
        headers: Headers;
        body: { userId: string; role: AppRole };
      }) => Promise<unknown>;
    };
  }

  private normalizeListUsersResult(result: BetterAuthListUsersResult): {
    users: AdminUserListItem[];
    total: number;
  } {
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

  private async resolveTargetUserRole(
    userId: string,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<string | undefined> {
    const api = this.getAdminApi();
    const headers = fromNodeHeaders(requestHeaders);

    if (typeof api.getUser === 'function') {
      try {
        const raw = (await api.getUser({
          headers,
          query: { id: userId },
        })) as BetterAuthGetUserResult;

        const role = extractRoleFromGetUser(raw);
        if (role !== undefined) {
          return role;
        }
      } catch {
        // Fall back to listUsers below.
      }
    }

    if (typeof api.listUsers !== 'function') {
      return undefined;
    }

    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total) {
      try {
        const raw = (await api.listUsers({
          headers,
          query: { limit: ROLE_LOOKUP_PAGE_SIZE, offset },
        })) as BetterAuthListUsersResult;

        const normalized = this.normalizeListUsersResult(raw);
        const targetUser = normalized.users.find((item) => item.id === userId);
        if (targetUser) {
          return targetUser.role;
        }

        total = normalized.total;
        if (normalized.users.length === 0) {
          break;
        }
        offset += ROLE_LOOKUP_PAGE_SIZE;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  async createUser(
    body: CreateAdminUserDto,
    requestHeaders: IncomingHttpHeaders,
  ): Promise<AdminUserListItem> {
    const adminApi = this.getAdminApi();

    if (typeof adminApi.createUser !== 'function') {
      throw new InternalServerErrorException(
        ADMIN_MESSAGES.SERVICE.CREATE_USER_UNAVAILABLE,
      );
    }

    const raw = await adminApi.createUser({
      headers: fromNodeHeaders(requestHeaders),
      body: {
        email: body.email.trim(),
        password: body.password,
        name: body.name.trim(),
        role: body.role,
      },
    });

    const normalized = unwrapCreateUserPayload(raw);
    const item = toAdminUserListItem(normalized);
    if (!item) {
      throw new InternalServerErrorException(
        'User was created but the response could not be normalized.',
      );
    }

    return item;
  }

  async updateUser(
    targetUserId: string,
    body: UpdateAdminUserDto,
    requestHeaders: IncomingHttpHeaders,
  ) {
    const data: Record<string, string> = {};
    if (body.name !== undefined) {
      data.name = body.name.trim();
    }
    if (body.email !== undefined) {
      data.email = body.email.trim();
    }

    const hasProfileFields = Object.keys(data).length > 0;
    const hasRole = body.role !== undefined;

    if (!hasProfileFields && !hasRole) {
      throw new BadRequestException(
        ADMIN_MESSAGES.VALIDATION.AT_LEAST_ONE_FIELD,
      );
    }

    if (hasProfileFields) {
      const adminApi = this.getAdminApi();

      if (!adminApi.adminUpdateUser) {
        throw new InternalServerErrorException(
          ADMIN_MESSAGES.SERVICE.UPDATE_USER_UNAVAILABLE,
        );
      }

      await adminApi.adminUpdateUser({
        headers: fromNodeHeaders(requestHeaders),
        body: {
          userId: targetUserId,
          data,
        },
      });
    }

    if (hasRole && body.role !== undefined) {
      await this.setUserRole(targetUserId, body.role, requestHeaders);
    }

    return { success: true };
  }

  async removeUser(
    targetUserId: string,
    adminUserId: string,
    requestHeaders: IncomingHttpHeaders,
  ) {
    if (targetUserId === adminUserId) {
      throw new BadRequestException(
        ADMIN_MESSAGES.SERVICE.REMOVE_SELF_FORBIDDEN,
      );
    }

    const targetRole = await this.resolveTargetUserRole(
      targetUserId,
      requestHeaders,
    );
    if (targetRole !== undefined && roleContainsAdmin(targetRole)) {
      throw new ForbiddenException(
        ADMIN_MESSAGES.SERVICE.REMOVE_ADMIN_FORBIDDEN,
      );
    }

    const adminApi = this.getAdminApi();

    if (!adminApi.removeUser) {
      throw new InternalServerErrorException(
        ADMIN_MESSAGES.SERVICE.REMOVE_USER_UNAVAILABLE,
      );
    }

    const removed = await adminApi.removeUser({
      headers: fromNodeHeaders(requestHeaders),
      body: {
        userId: targetUserId,
      },
    });

    return removed;
  }

  async setUserRole(
    userId: string,
    role: AppRole,
    requestHeaders: IncomingHttpHeaders,
  ) {
    // Forward caller headers so Better Auth can validate admin privileges.
    const adminApi = this.getAdminApi();
    return adminApi.setRole({
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
    const adminApi = this.getAdminApi();

    if (!adminApi.listUsers) {
      throw new InternalServerErrorException(
        ADMIN_MESSAGES.SERVICE.LIST_USERS_UNAVAILABLE,
      );
    }

    const result = (await adminApi.listUsers({
      headers: fromNodeHeaders(requestHeaders),
      query: {
        limit: options.limit,
        offset: options.offset,
      },
    })) as BetterAuthListUsersResult;

    return this.normalizeListUsersResult(result);
  }
}
