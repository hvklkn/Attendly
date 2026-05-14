"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  History,
  LayoutDashboard,
  QrCode,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { NavigationIcon, NavigationItem } from "@/types/navigation";

const navIcons: Record<NavigationIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  sessions: CalendarDays,
  sections: BookOpen,
  users: Users,
  reports: BarChart3,
  settings: Settings,
  scan: QrCode,
  history: History,
  profile: UserRound,
};

type AppSidebarProps = {
  areaLabel: string;
  homeHref: string;
  items: NavigationItem[];
  variant?: "desktop" | "mobile";
  className?: string;
};

export function AppSidebar({
  areaLabel,
  homeHref,
  items,
  variant = "desktop",
  className,
}: AppSidebarProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className={cn("flex gap-2 overflow-x-auto", className)}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon ? navIcons[item.icon] : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {item.title}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-neutral-200 bg-white",
        className,
      )}
    >
      <div className="border-b border-neutral-200 px-6 py-5">
        <Link href={homeHref} className="block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">
              A
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-950">
                {siteConfig.name}
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {areaLabel} alanı
              </p>
            </div>
          </div>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon ? navIcons[item.icon] : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex gap-3 rounded-lg px-3 py-3 transition",
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    active ? "text-white" : "text-neutral-500",
                  )}
                  aria-hidden="true"
                />
              ) : null}
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.title}</span>
                {item.description ? (
                  <span
                    className={cn(
                      "mt-1 block text-xs leading-5",
                      active ? "text-neutral-300" : "text-neutral-500",
                    )}
                  >
                    {item.description}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
          Ortam
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-800">
          Temel yapı
        </p>
      </div>
    </aside>
  );
}
