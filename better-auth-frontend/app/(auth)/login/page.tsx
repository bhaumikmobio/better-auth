"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AUTH_DIVIDER_CLASSNAME,
  AUTH_FOOTER_TEXT_CLASSNAME,
  AUTH_GOOGLE_BUTTON_CLASSNAME,
  AUTH_LINK_CLASSNAME,
  AUTH_TITLE_CLASSNAME,
} from "@/utils/auth-ui";
import { AuthInputField } from "@/components/form/AuthInputField";
import { PasswordField } from "@/components/form/PasswordField";
import { GoogleIcon } from "@/components/icons/SvgIcons";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { AppLoader } from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LOGIN_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { getResultErrorMessage, unknownToMessage } from "@/utils/auth-feedback";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isLoading = isEmailLoading || isGoogleLoading;

  const hasAdminRole = (roleValue: unknown): boolean => {
    if (typeof roleValue !== "string") return false;
    return roleValue
      .split(",")
      .map((role) => role.trim())
      .includes("admin");
  };

  const handleLogin = async () => {
    setIsEmailLoading(true);
    let shouldResetLoading = true;

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
      const role = (result as { user?: { role?: unknown } })?.user?.role;
      const redirectTo = hasAdminRole(role) ? ROUTES.admin : ROUTES.dashboard;
      shouldResetLoading = false;
      router.replace(redirectTo);
      return;
    } catch (e) {
      toast.error(unknownToMessage(e, LOGIN_COPY.toast.failure));
    } finally {
      if (shouldResetLoading) {
        setIsEmailLoading(false);
      }
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
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLoader
        message={isGoogleLoading ? LOGIN_COPY.googleButtonLoading : LOGIN_COPY.submitLoading}
      />
    );
  }

  return (
    <CenteredCard
      title={LOGIN_COPY.title}
      titleClassName={AUTH_TITLE_CLASSNAME}
      description={LOGIN_COPY.description}
      topContent={<BrandLogo size="md" />}
      footer={
        <div className={`space-y-2 ${AUTH_FOOTER_TEXT_CLASSNAME}`}>
          <div>
            {LOGIN_COPY.noAccountPrefix}{" "}
            <Link className={AUTH_LINK_CLASSNAME} href={ROUTES.signup}>
              {LOGIN_COPY.noAccountLink}
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

        <div className="text-right">
          <Link className={`text-sm ${AUTH_LINK_CLASSNAME}`} href={ROUTES.forgotPassword}>
            {LOGIN_COPY.forgotPasswordLink}
          </Link>
        </div>

        <Button
          onClick={handleLogin}
          disabled={!email || !password || isLoading}
          isLoading={isEmailLoading}
          fullWidth
        >
          {isEmailLoading ? LOGIN_COPY.submitLoading : LOGIN_COPY.submit}
        </Button>

        <div className={AUTH_DIVIDER_CLASSNAME}>or</div>

        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          isLoading={isGoogleLoading}
          fullWidth
          variant="secondary"
          className={AUTH_GOOGLE_BUTTON_CLASSNAME}
        >
          {isGoogleLoading ? (
            LOGIN_COPY.googleButtonLoading
          ) : (
            <span className="inline-flex items-center gap-2">
              <GoogleIcon />
              <span>{LOGIN_COPY.googleButton}</span>
            </span>
          )}
        </Button>
      </div>
    </CenteredCard>
  );
}

