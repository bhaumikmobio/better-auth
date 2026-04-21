import type { AppShellUser } from "./types";

type AppHeaderProps = {
  title: string;
  description: string;
  user: AppShellUser;
};

export function AppHeader({ title, description, user }: AppHeaderProps) {
  const displayName = user.name?.trim() || "Logged-in user";
  const displayEmail = user.email?.trim() || "No email available";
  const roleLabel = user.role?.split(",")[0]?.trim();
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="shrink-0 border-b border-cyan-200/80 bg-white/70 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-sky-900">{title}</h2>
          <p className="mt-1 text-sm text-sky-800/80">{description}</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-cyan-200/80 bg-cyan-50/60 px-2.5 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight text-sky-900">{displayName}</p>
            <p className="truncate text-[11px] leading-tight text-sky-800/80">{displayEmail}</p>
          </div>
          {roleLabel ? (
            <p className="rounded-full border border-cyan-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              {roleLabel}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
