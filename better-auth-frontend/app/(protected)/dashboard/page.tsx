"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CenteredCard } from "@/components/layout/CenteredCard";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_COPY } from "@/constants/messages";
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
      toast.success(DASHBOARD_COPY.toast.logoutSuccess);
    } finally {
      setIsSigningOut(false);
      router.replace(ROUTES.login);
      router.refresh();
    }
  };

  return (
    <CenteredCard
      title={DASHBOARD_COPY.title}
      description={DASHBOARD_COPY.description}
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Link
          className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          href={ROUTES.changePassword}
        >
          {DASHBOARD_COPY.changePassword}
        </Link>
        <Button
          variant="secondary"
          className="border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          onClick={handleLogout}
          disabled={isPending || !user}
          isLoading={isSigningOut}
        >
          {isSigningOut ? DASHBOARD_COPY.logoutLoading : DASHBOARD_COPY.logout}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-base text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
        {isPending ? (
          <div>{DASHBOARD_COPY.sessionLoading}</div>
        ) : user ? (
          <div className="space-y-2">
            <div>
              <span className="font-medium">{DASHBOARD_COPY.signedInAsLabel}</span>{" "}
              {user.email ?? DASHBOARD_COPY.unknownEmail}
            </div>
            {user.name ? (
              <div className="font-medium">
                {DASHBOARD_COPY.namePrefix} {user.name}
              </div>
            ) : null}
          </div>
        ) : (
          <div>{DASHBOARD_COPY.redirecting}</div>
        )}
      </div>
    </CenteredCard>
  );
}
