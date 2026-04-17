export type AppShellUser = {
  email?: string | null;
  name?: string | null;
  role?: string;
};

export type AppNavItem = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
};
