import "server-only";

import { requireRole } from "@/lib/auth/guards";
import type { AuthContext } from "@/types/auth";

export type InstructorAuthContext = AuthContext;

export async function requireInstructorAuthContext() {
  return requireRole("INSTRUCTOR");
}

export function getInstructorOrganizationId(
  authContext: InstructorAuthContext,
) {
  return authContext.activeOrganization.id;
}
