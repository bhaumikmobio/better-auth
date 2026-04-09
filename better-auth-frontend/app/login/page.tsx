"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import { getResultErrorMessage, unknownToMessage } from "../../lib/auth-feedback";

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
      router.replace("/dashboard");
    } catch (e) {
      toast.error(unknownToMessage(e, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Use your email and password.
          </p>
        </div>

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

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            type="button"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </div>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Don’t have an account?{" "}
          <Link className="font-medium text-black dark:text-white" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

