import { AppShell } from "@/components/layout/shell/AppShell";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionOrRedirect("admin");
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  return (
    <AppShell title="Admin" description="" user={user}>
      <div className="h-full min-h-[calc(100vh-14rem)]">{children}</div>
    </AppShell>
  );
}
