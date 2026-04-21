"use client";

import type { AdminUser } from "@/lib/admin-api";
import { actionIconButton } from "@/components/ui/action-variants";
import { ADMIN_COPY } from "@/constants/messages";
import { hasAdminRole } from "@/lib/user-role";
import { Pencil, Trash2 } from "lucide-react";

type AdminUserRowActionsProps = {
  user: AdminUser;
  currentUserId: string | null;
  isMutating: boolean;
  onEdit: (user: AdminUser) => void;
  onRequestDelete: (user: AdminUser) => void;
};

export function AdminUserRowActions({
  user,
  currentUserId,
  isMutating,
  onEdit,
  onRequestDelete,
}: AdminUserRowActionsProps) {
  const isSelf = currentUserId !== null && user.id === currentUserId;
  const isAdminTarget = hasAdminRole(user.role);
  const deleteDisabledReason = isSelf
    ? ADMIN_COPY.userActions.cannotDeleteSelf
    : isAdminTarget
      ? ADMIN_COPY.userActions.cannotDeleteAdmin
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={actionIconButton.default}
        disabled={isMutating}
        aria-label={ADMIN_COPY.userActions.updateAriaLabel}
        onClick={() => onEdit(user)}
      >
        <Pencil className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className={actionIconButton.danger}
        disabled={isMutating || isSelf || isAdminTarget}
        aria-label={ADMIN_COPY.userActions.deleteAriaLabel}
        title={deleteDisabledReason}
        onClick={() => onRequestDelete(user)}
      >
        <Trash2 className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
