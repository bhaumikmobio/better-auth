import { ADMIN_COPY } from "@/constants/messages";
import type { AdminUser } from "@/lib/admin-api";

export type AdminOverviewStat = {
  label: string;
  value: string;
  helper: string;
  helperTone: string;
};

function hasAdminRole(role: string): boolean {
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
}

export function buildAdminOverviewStats(users: AdminUser[], total: number): AdminOverviewStat[] {
  const adminCount = users.filter((user) => hasAdminRole(user.role)).length;
  const activeCount = users.filter((user) => user.status === "active").length;
  const inactiveCount = users.filter((user) => user.status === "inactive").length;

  return [
    {
      label: ADMIN_COPY.overviewStats.totalUsers,
      value: String(total),
      helper: `${activeCount} ${ADMIN_COPY.overviewStats.activeSuffix}`,
      helperTone: "text-emerald-700",
    },
    {
      label: ADMIN_COPY.overviewStats.inactiveUsers,
      value: String(inactiveCount),
      helper: ADMIN_COPY.overviewStats.needsReview,
      helperTone: "text-rose-700",
    },
    {
      label: ADMIN_COPY.overviewStats.admins,
      value: String(adminCount),
      helper: ADMIN_COPY.overviewStats.accessControl,
      helperTone: "text-sky-700",
    },
    {
      label: ADMIN_COPY.overviewStats.standardUsers,
      value: String(Math.max(total - adminCount, 0)),
      helper: ADMIN_COPY.overviewStats.roleUser,
      helperTone: "text-slate-700",
    },
  ];
}
