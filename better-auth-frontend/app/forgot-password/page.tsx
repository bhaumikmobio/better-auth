"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AuthInputField } from "@/components/form/AuthInputField";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { getResultErrorMessage, unknownToMessage } from "@/common/auth-feedback";
import { FORGOT_PASSWORD_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    setIsLoading(true);
    try {
      const origin = window.location.origin;
      const result: unknown = await authClient.requestPasswordReset({
        email,
        redirectTo: `${origin}${ROUTES.resetPassword}`,
      });

      const resultError = getResultErrorMessage(result, FORGOT_PASSWORD_COPY.toast.failure);
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success(FORGOT_PASSWORD_COPY.toast.success);
    } catch (e) {
      toast.error(unknownToMessage(e, FORGOT_PASSWORD_COPY.toast.failure));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title={FORGOT_PASSWORD_COPY.title}
      description={FORGOT_PASSWORD_COPY.description}
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="font-medium text-black dark:text-white" href={ROUTES.login}>
            {FORGOT_PASSWORD_COPY.backToLogin}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <AuthInputField
          label={FORGOT_PASSWORD_COPY.emailLabel}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder={FORGOT_PASSWORD_COPY.emailPlaceholder}
        />

        <Button
          onClick={handleRequestReset}
          disabled={!email}
          isLoading={isLoading}
          fullWidth
        >
          {isLoading ? FORGOT_PASSWORD_COPY.submitLoading : FORGOT_PASSWORD_COPY.submit}
        </Button>
      </div>
    </CenteredCard>
  );
}
