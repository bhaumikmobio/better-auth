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
  const totalReactions = standups.reduce(
    (sum, item) => sum + item.reactions.reduce((inner, reaction) => inner + reaction.count, 0),
    0,
  );

  return (
    <div className="h-full space-y-6">
      <section className="rounded-3xl border border-cyan-200/80 bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 p-5 shadow-[0_24px_42px_-36px_rgba(14,116,144,0.7)] sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-cyan-200/90 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
              Admin command center
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ADMIN_COPY.overviewTitle}</h2>
            <p className="max-w-2xl text-sm text-slate-700">
              Operational insights for users, updates, and team momentum.
            </p>
          </div>
          <Link
            className="inline-flex rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(12,74,110,0.9)] transition hover:from-cyan-500 hover:via-sky-600 hover:to-blue-700"
            href={ROUTES.adminStandup}
          >
            Open stand-up dashboard
          </Link>
        </div>
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
          {overviewStats.map((stat, index) => (
            <article
              key={stat.label}
              className="group rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_20px_35px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_42px_-30px_rgba(14,116,144,0.35)]"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/90" />
              </div>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className={`mt-2 text-sm font-medium ${stat.helperTone}`}>{stat.helper}</p>
              <div
                className={`mt-3 h-1 rounded-full ${
                  index % 4 === 0
                    ? "bg-gradient-to-r from-cyan-500 to-sky-500"
                    : index % 4 === 1
                      ? "bg-gradient-to-r from-rose-400 to-orange-400"
                      : index % 4 === 2
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
              />
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Project operations</h3>
          <span className="rounded-full border border-cyan-200/80 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
            Live metrics
          </span>
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
            <article className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-white via-cyan-50/80 to-sky-50/80 p-4 shadow-[0_22px_36px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Today&apos;s updates</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{totalUpdates}</p>
              <p className="mt-2 text-sm text-slate-600">Team submissions for current day.</p>
            </article>

            <article className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/80 to-orange-50/70 p-4 shadow-[0_22px_36px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Blockers raised</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{blockers.length}</p>
              <p className="mt-2 text-sm text-slate-600">Items requiring follow-up and unblocking.</p>
            </article>

            <article className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white via-violet-50/75 to-indigo-50/75 p-4 shadow-[0_22px_36px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-sm text-slate-600">Total reactions</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{totalReactions}</p>
              <p className="mt-2 text-sm text-slate-600">Team engagement across today&apos;s updates.</p>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
