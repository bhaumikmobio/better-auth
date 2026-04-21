"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_COPY } from "@/constants/messages";
import { AdminCreateUserDialog } from "@/components/admin/AdminCreateUserDialog";
import { AdminEditUserDialog } from "@/components/admin/AdminEditUserDialog";
import { AdminUserRoleBadge } from "@/components/admin/AdminUserRoleBadge";
import { AdminUserRowActions } from "@/components/admin/AdminUserRowActions";
import { AdminUserStatusCell } from "@/components/admin/AdminUserStatusCell";
import { AppLoader } from "@/components/ui/AppLoader";
import { BaseTable } from "@/components/ui/BaseTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminUser } from "@/lib/admin-api";
import { useSession } from "@/hooks/use-session";
import {
  ADMIN_CREATE_USER_MUTATION_ID,
  useAdminUsers,
} from "@/hooks/use-admin-users";
import { Button } from "@/components/ui/Button";
import { messageFromUnknownError } from "@/lib/unknown-error";
import type { AdminUserCreateFormValues, AdminUserEditFormValues } from "@/types/admin.types";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userPendingDelete, setUserPendingDelete] = useState<AdminUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    users,
    isLoading,
    errorMessage,
    mutatingUserId,
    updateUser,
    createUser,
    deleteUser,
  } = useAdminUsers({
    limit: 100,
    offset: 0,
  });

  async function handleEditSubmit(userId: string, values: AdminUserEditFormValues) {
    try {
      await updateUser(userId, values);
      toast.success(ADMIN_COPY.userActions.updateSuccess);
      setEditingUser(null);
    } catch (error) {
      toast.error(messageFromUnknownError(error, ADMIN_COPY.userActions.updateFailed));
    }
  }

  async function handleCreateSubmit(values: AdminUserCreateFormValues) {
    try {
      await createUser(values);
      toast.success(ADMIN_COPY.userActions.createSuccess);
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(messageFromUnknownError(error, ADMIN_COPY.userActions.createFailed));
    }
  }

  async function handleConfirmDelete() {
    if (!userPendingDelete) return;
    try {
      await deleteUser(userPendingDelete.id);
      toast.success(ADMIN_COPY.userActions.deleteSuccess);
      setUserPendingDelete(null);
    } catch (error) {
      toast.error(messageFromUnknownError(error, ADMIN_COPY.userActions.deleteFailed));
    }
  }

  return (
    <section className="h-full">
      {userPendingDelete ? (
        <ConfirmDialog
          title={ADMIN_COPY.userActions.deleteDialogTitle}
          description={`${userPendingDelete.name} (${userPendingDelete.email}). ${ADMIN_COPY.userActions.deleteDialogBody}`}
          confirmLabel={ADMIN_COPY.userActions.deleteConfirmAction}
          confirmLoadingLabel={ADMIN_COPY.userActions.deleteConfirmLoading}
          cancelLabel={ADMIN_COPY.userActions.cancel}
          onConfirm={handleConfirmDelete}
          onDismiss={() => setUserPendingDelete(null)}
          isConfirming={
            mutatingUserId !== null && mutatingUserId === userPendingDelete.id
          }
        />
      ) : null}

      {isCreateOpen ? (
        <AdminCreateUserDialog
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={mutatingUserId === ADMIN_CREATE_USER_MUTATION_ID}
        />
      ) : null}

      {editingUser ? (
        <AdminEditUserDialog
          key={editingUser.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditSubmit}
          isSubmitting={mutatingUserId === editingUser.id}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ADMIN_COPY.usersTitle}</h2>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={mutatingUserId !== null}
          onClick={() => {
            setEditingUser(null);
            setUserPendingDelete(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {ADMIN_COPY.userActions.addUserButton}
        </Button>
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
            ADMIN_COPY.tableHeaders.actions,
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
              <td className="px-4 py-3">
                <AdminUserRowActions
                  user={user}
                  currentUserId={currentUserId}
                  isMutating={mutatingUserId === user.id}
                  onEdit={(next) => {
                    setUserPendingDelete(null);
                    setEditingUser(next);
                  }}
                  onRequestDelete={(next) => {
                    setEditingUser(null);
                    setUserPendingDelete(next);
                  }}
                />
              </td>
            </tr>
          ))}
        </BaseTable>
      )}
    </section>
  );
}
