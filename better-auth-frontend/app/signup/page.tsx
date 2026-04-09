"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { SIGNUP_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { getResultErrorMessage, unknownToMessage } from "@/common/auth-feedback";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title={SIGNUP_COPY.title}
      description={SIGNUP_COPY.description}
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {SIGNUP_COPY.haveAccountPrefix}{" "}
          <Link className="font-medium text-black dark:text-white" href={ROUTES.login}>
            {SIGNUP_COPY.haveAccountLink}
          </Link>
        </div>
      }
    >
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            {SIGNUP_COPY.nameLabel}
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              placeholder={SIGNUP_COPY.namePlaceholder}
            />
          </label>

          <label className="block text-sm font-medium">
            {SIGNUP_COPY.emailLabel}
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder={SIGNUP_COPY.emailPlaceholder}
            />
          </label>

          <label className="block text-sm font-medium">
            {SIGNUP_COPY.passwordLabel}
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder={SIGNUP_COPY.passwordPlaceholder}
            />
          </label>

          <Button
            onClick={handleSignup}
            disabled={!name || !email || !password}
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? SIGNUP_COPY.submitLoading : SIGNUP_COPY.submit}
          </Button>
        </div>
    </CenteredCard>
  );
}

