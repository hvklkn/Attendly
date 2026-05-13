import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNavigation } from "@/config/navigation";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authContext = await requireRole("SUPER_ADMIN", "ORG_ADMIN");

  return (
    <DashboardShell navigation={adminNavigation} authContext={authContext}>
      {children}
    </DashboardShell>
  );
}
