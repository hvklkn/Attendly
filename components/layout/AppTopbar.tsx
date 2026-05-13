"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import type { AuthContext } from "@/types/auth";
import type { NavigationItem } from "@/types/navigation";

type AppTopbarProps = {
  areaLabel: string;
  authContext?: AuthContext;
  navigationItems?: NavigationItem[];
};

function formatRole(role?: string) {
  return role ? role.replace("_", " ") : "Workspace";
}

export function AppTopbar({
  areaLabel,
  authContext,
  navigationItems = [],
}: AppTopbarProps) {
  const pathname = usePathname();
  const currentItem =
    navigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0];

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
            {areaLabel}
          </p>
          <p className="truncate text-sm font-semibold text-neutral-950">
            {currentItem?.title ?? authContext?.activeOrganization.name}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 md:flex">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              aria-label="Search"
              placeholder="Search workspace"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-950 sm:inline-flex"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>

          {authContext ? (
            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-medium text-neutral-950">
                  {authContext.user.name ?? authContext.user.email}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatRole(authContext.role)}
                </p>
              </div>
              <div className="hidden h-9 w-px bg-neutral-200 sm:block" />
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition",
                    "hover:border-neutral-400 hover:text-neutral-950",
                  )}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          ) : (
            <StatusBadge label="Scaffold" tone="info" />
          )}
        </div>
      </div>
    </header>
  );
}
