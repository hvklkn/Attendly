import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { instructorNavigation } from "@/config/navigation";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function InstructorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authContext = await requireRole("INSTRUCTOR");

  return (
    <DashboardShell
      navigation={instructorNavigation}
      authContext={authContext}
    >
      {children}
    </DashboardShell>
  );
}
