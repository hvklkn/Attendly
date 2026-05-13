import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { studentNavigation } from "@/config/navigation";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell navigation={studentNavigation}>{children}</DashboardShell>
  );
}
