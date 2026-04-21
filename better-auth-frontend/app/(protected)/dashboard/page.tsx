import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell/AppShell";
import { DASHBOARD_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

function StandupIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 4h8" />
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  );
}

function SecurityIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.2-2.9 7.9-7 9-4.1-1.1-7-4.8-7-9V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.2-3.4" />
    </svg>
  );
}

function ProfileIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.5-2.6 3.8-3.9 6.5-3.9s5 1.3 6.5 3.9" />
    </svg>
  );
}

function hasAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
}

export default async function DashboardPage() {
  const session = await getSessionOrRedirect();
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  if (hasAdminRole(user.role)) {
    redirect(ROUTES.admin);
  }

  return (
    <AppShell
      title={DASHBOARD_COPY.title}
      description={DASHBOARD_COPY.description}
      user={user}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-cyan-200/80 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 p-5 shadow-[0_22px_40px_-34px_rgba(14,116,144,0.65)] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-cyan-200/90 bg-white/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                Daily execution
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {DASHBOARD_COPY.projectWorkspaceTitle}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-700">{DASHBOARD_COPY.projectWorkspaceDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(12,74,110,0.9)] transition hover:from-cyan-500 hover:via-sky-600 hover:to-blue-700"
                href={ROUTES.standup}
              >
                {DASHBOARD_COPY.openStandup}
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {DASHBOARD_COPY.quickActionsTitle}
            </h3>
            <p className="text-sm text-slate-600">{DASHBOARD_COPY.quickActionsDescription}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_22px_34px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_26px_42px_-30px_rgba(14,116,144,0.4)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-slate-900">{DASHBOARD_COPY.standupActionTitle}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/90 bg-cyan-50 text-sm text-sky-700">
                  <StandupIcon />
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{DASHBOARD_COPY.standupActionDescription}</p>
              <Link
                className="mt-4 inline-block text-sm font-semibold text-sky-700 underline-offset-4 transition group-hover:underline"
                href={ROUTES.standup}
              >
                {DASHBOARD_COPY.openStandup}
              </Link>
            </article>

            <article className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_22px_34px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_26px_42px_-30px_rgba(180,83,9,0.35)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-slate-900">{DASHBOARD_COPY.securityActionTitle}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/90 bg-amber-50 text-sm text-amber-700">
                  <SecurityIcon />
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{DASHBOARD_COPY.securityActionDescription}</p>
              <Link
                className="mt-4 inline-block text-sm font-semibold text-sky-700 underline-offset-4 transition group-hover:underline"
                href={ROUTES.changePassword}
              >
                {DASHBOARD_COPY.managePassword}
              </Link>
            </article>

            <article className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_22px_34px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_26px_42px_-30px_rgba(109,40,217,0.35)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-slate-900">{DASHBOARD_COPY.profileActionTitle}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-200/90 bg-violet-50 text-sm text-violet-700">
                  <ProfileIcon />
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{DASHBOARD_COPY.profileActionDescription}</p>
              <Link
                className="mt-4 inline-block text-sm font-semibold text-sky-700 underline-offset-4 transition group-hover:underline"
                href={ROUTES.profile}
              >
                {DASHBOARD_COPY.openProfile}
              </Link>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
