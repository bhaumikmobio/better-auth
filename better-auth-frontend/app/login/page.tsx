"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
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
        "Invalid email or password",
      );
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success("Logged in.");
      router.replace(ROUTES.dashboard);
    } catch (e) {
      toast.error(unknownToMessage(e, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title="Log in"
      description="Use your email and password."
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Don’t have an account?{" "}
          <Link className="font-medium text-black dark:text-white" href={ROUTES.signup}>
            Sign up
          </Link>
        </div>
      }
    >
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <Button
            onClick={handleLogin}
            disabled={!email || !password}
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </div>
    </CenteredCard>
  );
}

