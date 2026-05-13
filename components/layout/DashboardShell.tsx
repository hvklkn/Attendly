import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import type { RoleNavigation } from "@/types/navigation";

type DashboardShellProps = {
  navigation: RoleNavigation;
  children: ReactNode;
};

export function DashboardShell({ navigation, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <AppSidebar
        areaLabel={navigation.label}
        homeHref={navigation.homeHref}
        items={navigation.items}
        className="hidden lg:flex"
      />
      <div className="lg:pl-72">
        <AppTopbar areaLabel={navigation.label} />
        <div className="border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 lg:hidden">
          <AppSidebar
            areaLabel={navigation.label}
            homeHref={navigation.homeHref}
            items={navigation.items}
            variant="mobile"
          />
        </div>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
