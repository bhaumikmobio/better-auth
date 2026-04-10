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
      <div className="flex items-start justify-between gap-4">
        <Link
          className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          href={ROUTES.changePassword}
        >
          {DASHBOARD_COPY.changePassword}
        </Link>
        <Button
          variant="secondary"
          onClick={handleLogout}
          disabled={isPending || !user}
          isLoading={isSigningOut}
        >
          {isSigningOut ? DASHBOARD_COPY.logoutLoading : DASHBOARD_COPY.logout}
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-zinc-900">
        {isPending ? (
          <div>{DASHBOARD_COPY.sessionLoading}</div>
        ) : user ? (
          <div>
            <div>
              <span className="font-medium">{DASHBOARD_COPY.signedInAsLabel}</span>{" "}
              {user.email ?? DASHBOARD_COPY.unknownEmail}
            </div>
            {user.name ? (
              <div className="mt-1 text-zinc-600 dark:text-zinc-400">
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

