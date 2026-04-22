import { AppShell } from "@/components/layout/shell/AppShell";
import { StandupHistoryExperience } from "@/components/standup/StandupHistoryExperience";
import { STANDUP_HISTORY_COPY } from "@/constants/messages";
import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function StandupHistoryPage() {
  const session = await getSessionOrRedirect();
  const user = session.user as {
    email?: string | null;
    name?: string | null;
    role?: string;
  };

  return (
    <AppShell
      title={STANDUP_HISTORY_COPY.title}
      description={STANDUP_HISTORY_COPY.description}
      user={user}
    >
      <StandupHistoryExperience />
    </AppShell>
  );
}
