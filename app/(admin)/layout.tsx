import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNavigation } from "@/config/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell navigation={adminNavigation}>{children}</DashboardShell>;
}
