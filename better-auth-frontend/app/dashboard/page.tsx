"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) router.replace(ROUTES.login);
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
      router.replace(ROUTES.login);
      router.refresh();
    }
  };

  return (
    <CenteredCard
      title="Dashboard"
      description="Minimal authenticated page."
      maxWidthClassName="max-w-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <Button
          variant="secondary"
          onClick={handleLogout}
          disabled={isPending || !user}
          isLoading={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Logout"}
        </Button>
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
    </CenteredCard>
  );
}

