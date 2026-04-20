import Link from "next/link";
import { AppShell } from "@/components/layout/shell/AppShell";
import { ROUTES } from "@/constants/routes";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function UnauthorizedPage() {
  const session = await getSessionOrRedirect();
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  return (
    <AppShell
      title="Access denied"
      description="You do not have permission to open the requested page."
      user={user}
    >
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-cyan-200/80 bg-white/90 p-8 text-center shadow-[0_20px_35px_-32px_rgba(14,116,144,0.95)]">
          <h1 className="text-2xl font-bold text-sky-900">Access denied</h1>
          <p className="mt-2 text-sm text-sky-800/80">
            You do not have permission to access this page.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
