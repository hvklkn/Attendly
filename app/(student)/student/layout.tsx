import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { studentNavigation } from "@/config/navigation";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authContext = await requireRole("STUDENT");

  return (
    <DashboardShell navigation={studentNavigation} authContext={authContext}>
      {children}
    </DashboardShell>
  );
}
