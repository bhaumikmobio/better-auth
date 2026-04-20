"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getResultErrorMessage, unknownToMessage } from "@/utils/auth-feedback";
import { AUTH_FOOTER_TEXT_CLASSNAME, AUTH_LINK_CLASSNAME } from "@/utils/auth-ui";
import { PasswordField } from "@/components/form/PasswordField";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { CHANGE_PASSWORD_COPY, PASSWORD_POLICY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < PASSWORD_POLICY.minLength) {
      toast.error(CHANGE_PASSWORD_COPY.minLengthHint);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(CHANGE_PASSWORD_COPY.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const result: unknown = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      const resultError = getResultErrorMessage(result, CHANGE_PASSWORD_COPY.toast.failure);
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success(CHANGE_PASSWORD_COPY.toast.success);
      if (revokeOtherSessions) {
        await authClient.signOut();
        router.replace(ROUTES.login);
        router.refresh();
        return;
      }

      router.replace(ROUTES.dashboard);
    } catch (e) {
      toast.error(unknownToMessage(e, CHANGE_PASSWORD_COPY.toast.failure));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title={CHANGE_PASSWORD_COPY.title}
      description={CHANGE_PASSWORD_COPY.description}
      showTitle={false}
      outerClassName="py-4 sm:py-5"
      footer={
        <div className={AUTH_FOOTER_TEXT_CLASSNAME}>
          <Link className={AUTH_LINK_CLASSNAME} href={ROUTES.dashboard}>
            {CHANGE_PASSWORD_COPY.backToDashboard}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <PasswordField
          label={CHANGE_PASSWORD_COPY.currentPasswordLabel}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
        />

        <PasswordField
          label={CHANGE_PASSWORD_COPY.newPasswordLabel}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
        />
        <p className="text-xs text-slate-500">
          {CHANGE_PASSWORD_COPY.minLengthHint}
        </p>

        <PasswordField
          label={CHANGE_PASSWORD_COPY.confirmPasswordLabel}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
        />

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={revokeOtherSessions}
            onChange={(e) => setRevokeOtherSessions(e.target.checked)}
            className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-cyan-200"
          />
          {CHANGE_PASSWORD_COPY.revokeOtherSessionsLabel}
        </label>

        <Button
          onClick={handleChangePassword}
          disabled={
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            newPassword.length < PASSWORD_POLICY.minLength
          }
          isLoading={isLoading}
          fullWidth
        >
          {isLoading ? CHANGE_PASSWORD_COPY.submitLoading : CHANGE_PASSWORD_COPY.submit}
        </Button>
      </div>
    </CenteredCard>
  );
}
