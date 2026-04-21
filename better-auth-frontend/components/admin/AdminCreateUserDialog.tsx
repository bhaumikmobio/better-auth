"use client";

import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { INPUT_CLASSNAME } from "@/components/form/AuthInputField";
import { PasswordField } from "@/components/form/PasswordField";
import { Button } from "@/components/ui/Button";
import { ADMIN_USER_FORM_DIALOG_CLASSNAME } from "@/components/admin/admin-user-dialog.constants";
import { ADMIN_COPY, PASSWORD_POLICY } from "@/constants/messages";
import { useIsClient } from "@/hooks/use-is-client";
import { useOpenModalDialog } from "@/hooks/use-open-modal-dialog";
import { ADMIN_ASSIGNABLE_ROLES, type AdminUserCreateFormValues } from "@/types/admin.types";
import type { UserRole } from "@/types/user.types";

type AdminCreateUserDialogProps = {
  onClose: () => void;
  onSubmit: (values: AdminUserCreateFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function AdminCreateUserDialog({
  onClose,
  onSubmit,
  isSubmitting,
}: AdminCreateUserDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const isClient = useIsClient();

  useOpenModalDialog(dialogRef, isClient);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
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
            {ADMIN_COPY.userActions.addTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{ADMIN_COPY.userActions.addDescription}</p>
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

        <PasswordField
          label={ADMIN_COPY.userActions.passwordLabel}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
          minLength={PASSWORD_POLICY.minLength}
          maxLength={PASSWORD_POLICY.maxLength}
          disabled={isSubmitting}
        />
        <p className="-mt-2 text-xs text-slate-500">{ADMIN_COPY.userActions.passwordHint}</p>

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
            {isSubmitting ? ADMIN_COPY.userActions.createLoading : ADMIN_COPY.userActions.create}
          </Button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
