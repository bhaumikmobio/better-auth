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

      const resultError = getResultErrorMessage(result, "Signup failed");
      if (resultError) {
        toast.error(resultError);
        return;
      }

      toast.success("Account created. Please log in.");
      router.replace(ROUTES.login);
    } catch (e) {
      toast.error(unknownToMessage(e, "Signup failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCard
      title="Sign up"
      description="Create an account with email and password."
      footer={
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link className="font-medium text-black dark:text-white" href={ROUTES.login}>
            Log in
          </Link>
        </div>
      }
    >
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Name
            <input
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              placeholder="Your name"
            />
          </label>

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
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>

          <Button
            onClick={handleSignup}
            disabled={!name || !email || !password}
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </div>
    </CenteredCard>
  );
}

