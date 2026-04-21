"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMIN_COPY } from "@/constants/messages";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  type AdminUser,
  updateAdminUser,
} from "@/lib/admin-api";
import { messageFromUnknownError } from "@/lib/unknown-error";
import type { AdminUserCreateFormValues, AdminUserEditFormValues } from "@/types/admin.types";

type UseAdminUsersOptions = {
  limit: number;
  offset: number;
};

export const ADMIN_CREATE_USER_MUTATION_ID = "__create__";

type UseAdminUsersResult = {
  users: AdminUser[];
  total: number;
  isLoading: boolean;
  errorMessage: string | null;
  mutatingUserId: string | null;
  updateUser: (userId: string, values: AdminUserEditFormValues) => Promise<void>;
  createUser: (values: AdminUserCreateFormValues) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export function useAdminUsers(options: UseAdminUsersOptions): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const updateUser = useCallback(async (userId: string, values: AdminUserEditFormValues) => {
    setMutatingUserId(userId);
    setErrorMessage(null);
    try {
      await updateAdminUser(userId, {
        name: values.name,
        email: values.email,
        role: values.role,
      });
      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === userId
            ? {
                ...item,
                name: values.name,
                email: values.email,
                role: values.role,
              }
            : item,
        ),
      );
    } catch (error) {
      setErrorMessage(
        messageFromUnknownError(error, ADMIN_COPY.userActions.updateFailed),
      );
      throw error;
    } finally {
      setMutatingUserId(null);
    }
  }, []);

  const createUser = useCallback(async (values: AdminUserCreateFormValues) => {
    setMutatingUserId(ADMIN_CREATE_USER_MUTATION_ID);
    setErrorMessage(null);
    try {
      await createAdminUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setRefreshTick((tick) => tick + 1);
    } catch (error) {
      setErrorMessage(
        messageFromUnknownError(error, ADMIN_COPY.userActions.createFailed),
      );
      throw error;
    } finally {
      setMutatingUserId(null);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setMutatingUserId(userId);
    setErrorMessage(null);
    try {
      await deleteAdminUser(userId);
      setUsers((previousUsers) => previousUsers.filter((item) => item.id !== userId));
      setTotal((previousTotal) => Math.max(0, previousTotal - 1));
    } catch (error) {
      setErrorMessage(
        messageFromUnknownError(error, ADMIN_COPY.userActions.deleteFailed),
      );
      throw error;
    } finally {
      setMutatingUserId(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await getAdminUsers({
          limit: options.limit,
          offset: options.offset,
        });
        if (!active) return;
        setUsers(response.users);
        setTotal(response.total);
      } catch (error) {
        if (!active) return;
        setUsers([]);
        setTotal(0);
        setErrorMessage(
          messageFromUnknownError(error, ADMIN_COPY.usersFetchFailed),
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      active = false;
    };
  }, [options.limit, options.offset, refreshTick]);

  return {
    users,
    total,
    isLoading,
    errorMessage,
    mutatingUserId,
    updateUser,
    createUser,
    deleteUser,
  };
}
