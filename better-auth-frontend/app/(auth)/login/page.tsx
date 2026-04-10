"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthInputField } from "@/components/form/AuthInputField";
import { PasswordField } from "@/components/form/PasswordField";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { LOGIN_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { getResultErrorMessage, unknownToMessage } from "@/common/auth-feedback";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const result: unknown = await authClient.signIn.email({
        email,
        password,
      });

      const resultError = getResultErrorMessage(
        result,
        LOGIN_COPY.toast.fallbackInvalidCredentials,
      );
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success(LOGIN_COPY.toast.success);
      router.replace(ROUTES.dashboard);
    } catch (e) {
      toast.error(unknownToMessage(e, LOGIN_COPY.toast.failure));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title={LOGIN_COPY.title}
      description={LOGIN_COPY.description}
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
          <div>
            {LOGIN_COPY.noAccountPrefix}{" "}
            <Link className="font-medium text-black dark:text-white" href={ROUTES.signup}>
              {LOGIN_COPY.noAccountLink}
            </Link>
          </div>
          <div>
            <Link className="font-medium text-black dark:text-white" href={ROUTES.forgotPassword}>
              {LOGIN_COPY.forgotPasswordLink}
            </Link>
          </div>
        </div>
      }
    >
        <div className="space-y-4">
          <AuthInputField
            label={LOGIN_COPY.emailLabel}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder={LOGIN_COPY.emailPlaceholder}
          />

          <PasswordField
            label={LOGIN_COPY.passwordLabel}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder={LOGIN_COPY.passwordPlaceholder}
          />

          <Button
            onClick={handleLogin}
            disabled={!email || !password}
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? LOGIN_COPY.submitLoading : LOGIN_COPY.submit}
          </Button>
        </div>
    </CenteredCard>
  );
}

