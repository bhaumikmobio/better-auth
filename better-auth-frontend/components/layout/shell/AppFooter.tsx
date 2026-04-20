import { APP_COPY } from "@/constants/messages";
import type { AppShellUser } from "./types";

type AppFooterProps = {
  user: AppShellUser;
};

export function AppFooter({ user }: AppFooterProps) {
  return (
    <footer className="shrink-0 border-t border-cyan-200/80 bg-white/70 px-4 py-3 text-xs text-sky-800/80 sm:px-6">
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium">{APP_COPY.appTitle}</span>
        <span className="truncate">
          Signed in as {user.email ?? "unknown"}
          {user.name ? ` (${user.name})` : ""}
        </span>
      </div>
    </footer>
  );
}
