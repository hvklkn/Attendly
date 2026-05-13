"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types/navigation";

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

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
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
          <p className="text-lg font-semibold text-neutral-950">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{areaLabel} area</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4 py-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-3 transition",
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              )}
            >
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
