import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { instructorNavigation } from "@/config/navigation";

export default function InstructorLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell navigation={instructorNavigation}>
      {children}
    </DashboardShell>
  );
}
