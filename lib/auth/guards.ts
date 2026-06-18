import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAuthContext } from "@/lib/auth/context";
import { createLoginPathWithNext } from "@/lib/auth/redirects";
import { getRoleHomePath, hasAnyRole } from "@/lib/auth/roles";
import type { MembershipRole } from "@/lib/generated/prisma/enums";

const CURRENT_PATH_HEADER = "x-attendly-current-path";

async function getCurrentRequestPath() {
  try {
    const headerStore = await headers();

    return headerStore.get(CURRENT_PATH_HEADER);
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    redirect(createLoginPathWithNext(await getCurrentRequestPath()));
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
