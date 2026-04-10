"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PasswordField } from "@/components/form/PasswordField";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { getResultErrorMessage, unknownToMessage } from "@/common/auth-feedback";
import { PASSWORD_POLICY, RESET_PASSWORD_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");
  const hasInvalidTokenError = useMemo(
    () => searchParams.get("error") === "INVALID_TOKEN",
    [searchParams],
  );

  const handleResetPassword = async () => {
    if (!token) {
      toast.error(RESET_PASSWORD_COPY.missingToken);
      return;
    }
    if (newPassword.length < PASSWORD_POLICY.minLength) {
      toast.error(RESET_PASSWORD_COPY.minLengthHint);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(RESET_PASSWORD_COPY.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const result: unknown = await authClient.resetPassword({
        token,
        newPassword,
      });

      const resultError = getResultErrorMessage(result, RESET_PASSWORD_COPY.toast.failure);
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success(RESET_PASSWORD_COPY.toast.success);
      router.replace(ROUTES.login);
    } catch (e) {
      toast.error(unknownToMessage(e, RESET_PASSWORD_COPY.toast.failure));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title={RESET_PASSWORD_COPY.title}
      description={RESET_PASSWORD_COPY.description}
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="font-medium text-black dark:text-white" href={ROUTES.login}>
            {RESET_PASSWORD_COPY.goToLogin}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {hasInvalidTokenError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200">
            {RESET_PASSWORD_COPY.invalidToken}
          </div>
        ) : null}

        <PasswordField
          label={RESET_PASSWORD_COPY.passwordLabel}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={RESET_PASSWORD_COPY.passwordPlaceholder}
        />
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {RESET_PASSWORD_COPY.minLengthHint}
        </p>

        <PasswordField
          label={RESET_PASSWORD_COPY.confirmPasswordLabel}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={RESET_PASSWORD_COPY.passwordPlaceholder}
        />

        <Button
          onClick={handleResetPassword}
          disabled={
            !newPassword ||
            !confirmPassword ||
            !token ||
            hasInvalidTokenError ||
            newPassword.length < PASSWORD_POLICY.minLength
          }
          isLoading={isLoading}
          fullWidth
        >
          {isLoading ? RESET_PASSWORD_COPY.submitLoading : RESET_PASSWORD_COPY.submit}
        </Button>
      </div>
    </CenteredCard>
  );
}
