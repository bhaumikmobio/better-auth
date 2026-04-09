"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) router.replace("/login");
  }, [isPending, session, router]);

  const user = session?.user;

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      toast.success("Logged out.");
    } finally {
      setIsSigningOut(false);
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Minimal authenticated page.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending || !user || isSigningOut}
            className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {isSigningOut ? "Signing out..." : "Logout"}
          </button>
        </div>

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

