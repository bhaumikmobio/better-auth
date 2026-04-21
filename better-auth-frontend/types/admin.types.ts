import type { UserRole } from "@/types/user.types";

/** Roles assignable via admin UI (aligned with backend `APP_ROLES`). */
export const ADMIN_ASSIGNABLE_ROLES: readonly UserRole[] = ["user", "admin"];

export type AdminUserEditFormValues = {
  name: string;
  email: string;
  role: UserRole;
};

export type AdminUserCreateFormValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};
