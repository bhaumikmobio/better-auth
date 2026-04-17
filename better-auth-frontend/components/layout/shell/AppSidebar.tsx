"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { APP_COPY } from "@/constants/messages";
import type { AppNavItem } from "./types";

type AppSidebarProps = {
  navItems: AppNavItem[];
  isSigningOut: boolean;
  onLogout: () => void;
};

export function AppSidebar({ navItems, isSigningOut, onLogout }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-cyan-200/80 bg-white/75 p-4 backdrop-blur md:h-screen md:w-72 md:border-b-0 md:border-r md:p-5">
      <div className="flex h-full flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/favIcon.png"
              alt={`${APP_COPY.appTitle} logo`}
              width={48}
              height={48}
              style={{ width: "48px", height: "48px" }}
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-sky-900">{APP_COPY.appTitle}</h1>
              <p className="mt-0.5 text-xs font-medium text-sky-700/80">Authenticated workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 md:flex-col md:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.match === "prefix" ? pathname.startsWith(item.href) : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 text-white shadow-[0_12px_28px_-18px_rgba(12,74,110,0.85)]"
                    : "border border-cyan-100/80 bg-white/90 text-sky-900 hover:border-cyan-200 hover:bg-cyan-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 md:mt-auto">
          <Button
            variant="secondary"
            className="w-full border border-rose-200/80 bg-rose-50/90 !text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:!text-rose-800"
            onClick={onLogout}
            isLoading={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Logout"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
