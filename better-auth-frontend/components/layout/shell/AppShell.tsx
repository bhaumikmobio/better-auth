"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import type { AppNavItem, AppShellUser } from "./types";

type AppShellProps = {
  title: string;
  description: string;
  user: AppShellUser;
  children: React.ReactNode;
  mainVerticalPaddingClassName?: string;
};

function hasAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role
    .split(",")
    .map((value) => value.trim())
    .includes("admin");
}

export function AppShell({
  title,
  description,
  user,
  children,
  mainVerticalPaddingClassName = "py-5 sm:py-6",
}: AppShellProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAdmin = hasAdminRole(user.role);
  const navItems: AppNavItem[] = [
    ...(isAdmin
      ? [
          { href: ROUTES.adminOverview, label: "Overview" },
          { href: ROUTES.adminUsers, label: "Users" },
          { href: ROUTES.adminStandup, label: "Stand-up" },
        ]
      : [
          { href: ROUTES.dashboard, label: "Dashboard" },
          { href: ROUTES.standup, label: "Stand-up" },
        ]),
    { href: ROUTES.profile, label: "Profile" },
    { href: ROUTES.changePassword, label: "Change Password" },
  ];

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      toast.success("Logged out.");
    } finally {
      setIsSigningOut(false);
      router.replace(ROUTES.login);
      router.refresh();
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden md:flex-row">
      <AppSidebar navItems={navItems} isSigningOut={isSigningOut} onLogout={handleLogout} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title={title} description={description} />

        <main
          className={`min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 ${mainVerticalPaddingClassName}`}
        >
          <div className="flex min-h-full w-full flex-col">
            <section className="flex min-h-full flex-1 flex-col rounded-2xl border border-cyan-200/80 bg-white/90 p-5 shadow-[0_20px_35px_-32px_rgba(14,116,144,0.95)] sm:p-6">
              {children}
            </section>
          </div>
        </main>

        <AppFooter user={user} />
      </div>
    </div>
  );
}
