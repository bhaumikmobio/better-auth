"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ADMIN_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { AppLoader } from "@/components/ui/AppLoader";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { useStandupAdmin } from "@/hooks/use-standup-admin";
import { buildAdminOverviewStats } from "@/lib/admin-overview";

export default function AdminOverviewPage() {
  const { users, total, isLoading, errorMessage } = useAdminUsers({
    limit: 200,
    offset: 0,
  });

  const overviewStats = useMemo(() => {
    return buildAdminOverviewStats(users, total);
  }, [total, users]);
  const {
    totalUpdates,
    blockers,
    standups,
    isLoading: isStandupLoading,
    errorMessage: standupError,
  } = useStandupAdmin();

  return (
    <div className="h-full space-y-5">
      <section className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ADMIN_COPY.overviewTitle}</h2>
        <p className="text-sm text-slate-600">Operational insights for users, updates, and team momentum.</p>
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
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.35)]"
            >
              <p className="text-sm text-slate-600">{stat.label}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className={`mt-2 text-sm font-medium ${stat.helperTone}`}>{stat.helper}</p>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Project operations</h3>
          <Link className="text-sm font-semibold text-sky-700 underline" href={ROUTES.adminStandup}>
            Open stand-up dashboard
          </Link>
        </div>

        {standupError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {standupError}
          </div>
        ) : isStandupLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
            <AppLoader compact message="Loading stand-up operations..." />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-cyan-50/70 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Today&apos;s updates</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{totalUpdates}</p>
              <p className="mt-2 text-sm text-slate-600">Team submissions for current day.</p>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-amber-50/70 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Blockers raised</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{blockers.length}</p>
              <p className="mt-2 text-sm text-slate-600">Items requiring follow-up and unblocking.</p>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-violet-50/70 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Total reactions</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                {standups.reduce(
                  (sum, item) => sum + item.reactions.reduce((inner, reaction) => inner + reaction.count, 0),
                  0,
                )}
              </p>
              <p className="mt-2 text-sm text-slate-600">Team engagement across today&apos;s updates.</p>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
