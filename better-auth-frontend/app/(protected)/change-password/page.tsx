import { ChangePasswordForm } from "@/components/change-password/ChangePasswordForm";
import { AppShell } from "@/components/layout/shell/AppShell";
import { CHANGE_PASSWORD_COPY } from "@/constants/messages";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function ChangePasswordPage() {
  const session = await getSessionOrRedirect();
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  return (
    <AppShell
      title={CHANGE_PASSWORD_COPY.title}
      description={CHANGE_PASSWORD_COPY.description}
      user={user}
      mainVerticalPaddingClassName="py-3 sm:py-4"
    >
      <div className="flex min-h-full flex-1 flex-col">
        <ChangePasswordForm />
      </div>
    </AppShell>
  );
}
