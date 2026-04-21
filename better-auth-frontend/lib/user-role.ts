import type { UserRole } from "@/types/user.types";

/** Matches comma-separated roles used by Better Auth / AppShell (`admin,user` etc.). */
export function hasAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes("admin");
}

/** Collapse stored role strings to a single UI select value. */
export function toFormUserRole(role: string): UserRole {
  return hasAdminRole(role) ? "admin" : "user";
}
