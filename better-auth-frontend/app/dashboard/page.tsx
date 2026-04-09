"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "../../lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) router.replace("/login");
  }, [isPending, session, router]);

  const user = session?.user;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Minimal authenticated page.
        </p>

        <div className="mt-6 rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-zinc-900">
          {isPending ? (
            <div>Loading session...</div>
          ) : user ? (
            <div>
              <div>
                <span className="font-medium">Signed in as:</span>{" "}
                {user.email ?? "unknown"}
              </div>
              {user.name ? (
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Name: {user.name}
                </div>
              ) : null}
            </div>
          ) : (
            <div>Redirecting to login...</div>
          )}
        </div>
      </div>
    </div>
  );
}

