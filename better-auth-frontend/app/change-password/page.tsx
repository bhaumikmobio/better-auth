"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getResultErrorMessage, unknownToMessage } from "@/common/auth-feedback";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { CHANGE_PASSWORD_COPY, PASSWORD_POLICY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) router.replace(ROUTES.login);
  }, [isPending, session, router]);

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
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="font-medium text-black dark:text-white" href={ROUTES.dashboard}>
            {CHANGE_PASSWORD_COPY.backToDashboard}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          {CHANGE_PASSWORD_COPY.currentPasswordLabel}
          <input
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
          />
        </label>

        <label className="block text-sm font-medium">
          {CHANGE_PASSWORD_COPY.newPasswordLabel}
          <input
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
          />
        </label>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {CHANGE_PASSWORD_COPY.minLengthHint}
        </p>

        <label className="block text-sm font-medium">
          {CHANGE_PASSWORD_COPY.confirmPasswordLabel}
          <input
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder={CHANGE_PASSWORD_COPY.passwordPlaceholder}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={revokeOtherSessions}
            onChange={(e) => setRevokeOtherSessions(e.target.checked)}
          />
          {CHANGE_PASSWORD_COPY.revokeOtherSessionsLabel}
        </label>

        <Button
          onClick={handleChangePassword}
          disabled={
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            isPending ||
            !session?.user ||
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
