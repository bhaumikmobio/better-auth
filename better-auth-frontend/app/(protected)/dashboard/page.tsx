import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell/AppShell";
import { DASHBOARD_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

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
      <div className="space-y-5">
        <section className="rounded-2xl border border-cyan-200/80 bg-cyan-50/85 p-4 text-sm text-sky-900">
          <p className="font-semibold">{DASHBOARD_COPY.projectWorkspaceTitle}</p>
          <p className="mt-1 text-sky-800">{DASHBOARD_COPY.projectWorkspaceDescription}</p>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {DASHBOARD_COPY.quickActionsTitle}
            </h3>
            <p className="text-sm text-slate-600">{DASHBOARD_COPY.quickActionsDescription}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.45)]">
              <p className="text-sm font-semibold text-slate-900">{DASHBOARD_COPY.standupActionTitle}</p>
              <p className="mt-1 text-sm text-slate-700">{DASHBOARD_COPY.standupActionDescription}</p>
              <Link className="mt-3 inline-block text-sm font-semibold text-sky-700 underline" href={ROUTES.standup}>
                {DASHBOARD_COPY.openStandup}
              </Link>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.45)]">
              <p className="text-sm font-semibold text-slate-900">{DASHBOARD_COPY.securityActionTitle}</p>
              <p className="mt-1 text-sm text-slate-700">{DASHBOARD_COPY.securityActionDescription}</p>
              <Link
                className="mt-3 inline-block text-sm font-semibold text-sky-700 underline"
                href={ROUTES.changePassword}
              >
                {DASHBOARD_COPY.managePassword}
              </Link>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.45)]">
              <p className="text-sm font-semibold text-slate-900">{DASHBOARD_COPY.profileActionTitle}</p>
              <p className="mt-1 text-sm text-slate-700">{DASHBOARD_COPY.profileActionDescription}</p>
              <Link className="mt-3 inline-block text-sm font-semibold text-sky-700 underline" href={ROUTES.profile}>
                {DASHBOARD_COPY.openProfile}
              </Link>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
