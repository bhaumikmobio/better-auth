"use client";

import { ADMIN_COPY } from "@/constants/messages";
import { AdminUserRoleBadge } from "@/components/admin/AdminUserRoleBadge";
import { AdminUserStatusCell } from "@/components/admin/AdminUserStatusCell";
import { AppLoader } from "@/components/ui/AppLoader";
import { BaseTable } from "@/components/ui/BaseTable";
import { useAdminUsers } from "@/hooks/use-admin-users";

export default function AdminUsersPage() {
  const { users, isLoading, errorMessage } = useAdminUsers({
    limit: 100,
    offset: 0,
  });

  return (
    <section className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ADMIN_COPY.usersTitle}</h2>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl bg-white/90 p-4">
          <AppLoader compact message={ADMIN_COPY.loadingUsers} />
        </div>
      ) : (
        <BaseTable
          headers={[
            ADMIN_COPY.tableHeaders.name,
            ADMIN_COPY.tableHeaders.email,
            ADMIN_COPY.tableHeaders.role,
            ADMIN_COPY.tableHeaders.status,
          ]}
          isEmpty={users.length === 0}
          emptyMessage={ADMIN_COPY.usersEmpty}
        >
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-200/80">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{user.email}</td>
              <td className="px-4 py-3">
                <AdminUserRoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3">
                <AdminUserStatusCell status={user.status} />
              </td>
            </tr>
          ))}
        </BaseTable>
      )}
    </section>
  );
}
