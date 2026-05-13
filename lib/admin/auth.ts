import "server-only";

import { requireRole } from "@/lib/auth/guards";
import type { AuthContext } from "@/types/auth";

export type AdminAuthContext = AuthContext;

export async function requireAdminAuthContext() {
  return requireRole("SUPER_ADMIN", "ORG_ADMIN");
}

export function getAdminOrganizationId(authContext: AdminAuthContext) {
  return authContext.activeOrganization.id;
}
