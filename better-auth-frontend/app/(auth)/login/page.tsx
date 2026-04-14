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
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isLoading = isEmailLoading || isGoogleLoading;

  const handleLogin = async () => {
    setIsEmailLoading(true);

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
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      const appOrigin = window.location.origin;
      const result: unknown = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${appOrigin}${ROUTES.dashboard}`,
        errorCallbackURL: `${appOrigin}${ROUTES.login}`,
      });

      const resultError = getResultErrorMessage(result, LOGIN_COPY.toast.googleFailure);
      if (resultError) {
        toast.error(resultError);
      }
    } catch (e) {
      toast.error(unknownToMessage(e, LOGIN_COPY.toast.googleFailure));
      setIsGoogleLoading(false);
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
            disabled={!email || !password || isLoading}
            isLoading={isEmailLoading}
            fullWidth
          >
            {isEmailLoading ? LOGIN_COPY.submitLoading : LOGIN_COPY.submit}
          </Button>

          <div className="text-center text-xs text-zinc-500">or</div>

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            isLoading={isGoogleLoading}
            fullWidth
            variant="secondary"
            className="border-blue-600 !text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:!text-blue-400 dark:hover:bg-blue-950/30"
          >
            {isGoogleLoading ? LOGIN_COPY.googleButtonLoading : LOGIN_COPY.googleButton}
          </Button>
        </div>
    </CenteredCard>
  );
}

