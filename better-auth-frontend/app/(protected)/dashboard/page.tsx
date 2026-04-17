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
      <div className="space-y-4">
        <p className="text-sm text-sky-900/90">
          <span className="font-semibold">{DASHBOARD_COPY.signedInAsLabel}</span>{" "}
          {user.email ?? DASHBOARD_COPY.unknownEmail}
        </p>
        {user.name ? (
          <p className="text-sm text-sky-900/90">
            <span className="font-semibold">{DASHBOARD_COPY.namePrefix}</span> {user.name}
          </p>
        ) : null}
        <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/85 p-4 text-sm text-sky-800">
          Your account is authenticated and ready to use.
          <br />
          You can update your password from{" "}
          <Link className="font-semibold underline" href={ROUTES.changePassword}>
            {DASHBOARD_COPY.changePassword}
          </Link>
          .
        </div>
      </div>
    </AppShell>
  );
}
