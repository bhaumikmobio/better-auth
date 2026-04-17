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
import { SIGNUP_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { getResultErrorMessage, unknownToMessage } from "@/utils/auth-feedback";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isLoading = isEmailLoading || isGoogleLoading;

  const handleSignup = async () => {
    setIsEmailLoading(true);

    try {
      const result: unknown = await authClient.signUp.email({
        name,
        email,
        password,
      });

      const resultError = getResultErrorMessage(result, SIGNUP_COPY.toast.fallback);
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success(SIGNUP_COPY.toast.success);
      router.replace(ROUTES.login);
    } catch (e) {
      toast.error(unknownToMessage(e, SIGNUP_COPY.toast.fallback));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);

    try {
      const appOrigin = window.location.origin;
      const result: unknown = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${appOrigin}${ROUTES.dashboard}`,
        errorCallbackURL: `${appOrigin}${ROUTES.login}`,
      });

      const resultError = getResultErrorMessage(result, SIGNUP_COPY.toast.googleFailure);
      if (resultError) {
        toast.error(resultError);
      }
    } catch (e) {
      toast.error(unknownToMessage(e, SIGNUP_COPY.toast.googleFailure));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLoader
        message={isGoogleLoading ? SIGNUP_COPY.googleButtonLoading : SIGNUP_COPY.submitLoading}
      />
    );
  }

  return (
    <CenteredCard
      title={SIGNUP_COPY.title}
      titleClassName={AUTH_TITLE_CLASSNAME}
      description={SIGNUP_COPY.description}
      footer={
        <div className={AUTH_FOOTER_TEXT_CLASSNAME}>
          {SIGNUP_COPY.haveAccountPrefix}{" "}
          <Link className={AUTH_LINK_CLASSNAME} href={ROUTES.login}>
            {SIGNUP_COPY.haveAccountLink}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <AuthInputField
          label={SIGNUP_COPY.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          autoComplete="name"
          placeholder={SIGNUP_COPY.namePlaceholder}
        />

        <AuthInputField
          label={SIGNUP_COPY.emailLabel}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder={SIGNUP_COPY.emailPlaceholder}
        />

        <PasswordField
          label={SIGNUP_COPY.passwordLabel}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={SIGNUP_COPY.passwordPlaceholder}
        />

        <Button
          onClick={handleSignup}
          disabled={!name || !email || !password || isLoading}
          isLoading={isEmailLoading}
          fullWidth
        >
          {isEmailLoading ? SIGNUP_COPY.submitLoading : SIGNUP_COPY.submit}
        </Button>

        <div className={AUTH_DIVIDER_CLASSNAME}>or</div>

        <Button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          isLoading={isGoogleLoading}
          fullWidth
          variant="secondary"
          className={AUTH_GOOGLE_BUTTON_CLASSNAME}
        >
          {isGoogleLoading ? (
            SIGNUP_COPY.googleButtonLoading
          ) : (
            <span className="inline-flex items-center gap-2">
              <GoogleIcon />
              <span>{SIGNUP_COPY.googleButton}</span>
            </span>
          )}
        </Button>
      </div>
    </CenteredCard>
  );
}

