import { AppShell } from "@/components/layout/shell/AppShell";
import { StandupExperience } from "@/components/standup/StandupExperience";
import { STANDUP_COPY } from "@/constants/messages";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function StandupPage() {
  const session = await getSessionOrRedirect();
  const user = session.user as { email?: string | null; name?: string | null; role?: string };

  return (
    <AppShell title={STANDUP_COPY.title} description={STANDUP_COPY.description} user={user}>
      <StandupExperience />
    </AppShell>
  );
}
