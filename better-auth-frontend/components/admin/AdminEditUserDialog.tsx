"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AdminUser } from "@/lib/admin-api";
import { INPUT_CLASSNAME } from "@/components/form/AuthInputField";
import { Button } from "@/components/ui/Button";
import { ADMIN_USER_FORM_DIALOG_CLASSNAME } from "@/components/admin/admin-user-dialog.constants";
import { ADMIN_COPY } from "@/constants/messages";
import { useIsClient } from "@/hooks/use-is-client";
import { useOpenModalDialog } from "@/hooks/use-open-modal-dialog";
import { toFormUserRole } from "@/lib/user-role";
import { ADMIN_ASSIGNABLE_ROLES, type AdminUserEditFormValues } from "@/types/admin.types";
import type { UserRole } from "@/types/user.types";

type AdminEditUserDialogProps = {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (userId: string, values: AdminUserEditFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function AdminEditUserDialog({
  user,
  onClose,
  onSubmit,
  isSubmitting,
}: AdminEditUserDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const isClient = useIsClient();

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setRole(toFormUserRole(user.role));
  }, [user]);

  useOpenModalDialog(dialogRef, isClient);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(user.id, {
      name: name.trim(),
      email: email.trim(),
      role,
    });
  }

  if (!isClient) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={ADMIN_USER_FORM_DIALOG_CLASSNAME}
      aria-labelledby={titleId}
      aria-modal="true"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
            {ADMIN_COPY.userActions.editTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{ADMIN_COPY.userActions.editDescription}</p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          {ADMIN_COPY.userActions.nameLabel}
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
            disabled={isSubmitting}
            className={`mt-2 ${INPUT_CLASSNAME}`}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {ADMIN_COPY.userActions.emailLabel}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            disabled={isSubmitting}
            className={`mt-2 ${INPUT_CLASSNAME}`}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {ADMIN_COPY.userActions.roleLabel}
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            disabled={isSubmitting}
            className={`mt-2 ${INPUT_CLASSNAME}`}
          >
            {ADMIN_ASSIGNABLE_ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => dialogRef.current?.close()}>
            {ADMIN_COPY.userActions.cancel}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? ADMIN_COPY.userActions.saveLoading : ADMIN_COPY.userActions.save}
          </Button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
