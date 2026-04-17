"use client";

import { useEffect, useState } from "react";
import { ADMIN_COPY } from "@/constants/messages";
import { getAdminUsers, type AdminUser } from "@/lib/admin-api";

type UseAdminUsersOptions = {
  limit: number;
  offset: number;
};

type UseAdminUsersResult = {
  users: AdminUser[];
  total: number;
  isLoading: boolean;
  errorMessage: string | null;
};

export function useAdminUsers(options: UseAdminUsersOptions): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setErrorMessage(error instanceof Error ? error.message : ADMIN_COPY.usersFetchFailed);
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
  }, [options.limit, options.offset]);

  return {
    users,
    total,
    isLoading,
    errorMessage,
  };
}
