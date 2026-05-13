import "server-only";

import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { getCurrentAuthContext } from "@/lib/auth/context";
import { getRoleHomePath, hasAnyRole } from "@/lib/auth/roles";
import type { MembershipRole } from "@/lib/generated/prisma/enums";

export async function requireAuth() {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    redirect(routes.public.login);
  }

  return authContext;
}

export async function requireRole(...roles: MembershipRole[]) {
  const authContext = await requireAuth();

  if (!hasAnyRole(authContext.role, roles)) {
    redirect(getRoleHomePath(authContext.role));
  }

  return authContext;
}

export const requireAnyRole = requireRole;

export async function requireOrganizationMembership() {
  const authContext = await requireAuth();

  return authContext.membership;
}
