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
          className="inline-flex h-11 items-center rounded-xl border border-sky-200/80 bg-white/80 px-4 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-cyan-50/85 hover:text-sky-800"
          href={ROUTES.changePassword}
        >
          {DASHBOARD_COPY.changePassword}
        </Link>
        <Button
          variant="secondary"
          className="border border-rose-200/80 bg-rose-50/85 !text-rose-700 hover:border-rose-300 hover:bg-rose-100/85 hover:!text-rose-800"
          onClick={handleLogout}
          disabled={isPending || !user}
          isLoading={isSigningOut}
        >
          {isSigningOut ? DASHBOARD_COPY.logoutLoading : DASHBOARD_COPY.logout}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-200/80 bg-cyan-50/85 p-6 text-base text-sky-800 shadow-[0_20px_35px_-32px_rgba(14,116,144,0.95)]">
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
