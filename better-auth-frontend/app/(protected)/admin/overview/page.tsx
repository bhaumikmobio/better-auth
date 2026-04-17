"use client";

import { useMemo } from "react";
import { ADMIN_COPY } from "@/constants/messages";
import { AppLoader } from "@/components/ui/AppLoader";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { buildAdminOverviewStats } from "@/lib/admin-overview";

export default function AdminOverviewPage() {
  const { users, total, isLoading, errorMessage } = useAdminUsers({
    limit: 200,
    offset: 0,
  });

  const overviewStats = useMemo(() => {
    return buildAdminOverviewStats(users, total);
  }, [total, users]);

  return (
    <div className="h-full space-y-5">
      <section className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ADMIN_COPY.overviewTitle}</h2>
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
          <AppLoader compact message={ADMIN_COPY.loadingOverview} />
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.35)]"
            >
              <p className="text-sm text-slate-600">{stat.label}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className={`mt-2 text-sm font-medium ${stat.helperTone}`}>{stat.helper}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
