import Link from "next/link";
import { AppShell } from "@/components/layout/shell/AppShell";
import { PROFILE_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function ProfilePage() {
  const session = await getSessionOrRedirect();
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  const displayName = user.name?.trim() || PROFILE_COPY.unknownValue;
  const displayEmail = user.email?.trim() || PROFILE_COPY.unknownValue;
  const displayRole = user.role?.trim() || PROFILE_COPY.roleFallback;
  const initials = displayName
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell title={PROFILE_COPY.title} description={PROFILE_COPY.description} user={user}>
      <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-cyan-200/80 bg-cyan-50/80 p-6 shadow-[0_20px_35px_-30px_rgba(14,116,144,0.55)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-lg font-semibold text-white">
              {initials || "U"}
            </div>
            <div>
              <p className="text-sm text-sky-800">{PROFILE_COPY.accountDetailsTitle}</p>
              <h3 className="text-xl font-semibold tracking-tight text-sky-950">{displayName}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-sky-900/90">{PROFILE_COPY.accountDetailsDescription}</p>
        </section>

        <section className="space-y-4">
          <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.4)]">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {PROFILE_COPY.accountDetailsTitle}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {PROFILE_COPY.fieldName}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{displayName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {PROFILE_COPY.fieldEmail}
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">{displayEmail}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {PROFILE_COPY.fieldRole}
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-900">{displayRole}</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.4)]">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {PROFILE_COPY.securityTitle}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{PROFILE_COPY.securityDescription}</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-sky-700 underline" href={ROUTES.changePassword}>
              {PROFILE_COPY.changePassword}
            </Link>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
