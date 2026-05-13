import "server-only";

import { OrganizationStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import { getSessionCookieValue, hashSessionToken } from "@/lib/auth/session";
import type { AuthContext } from "@/types/auth";

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const token = await getSessionCookieValue();

  if (!token) {
    return null;
  }

  const deviceSession = await db.deviceSession.findFirst({
    where: {
      sessionTokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      lastSeenAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (
    !deviceSession ||
    deviceSession.user.status !== UserStatus.ACTIVE ||
    deviceSession.organization.status !== OrganizationStatus.ACTIVE
  ) {
    return null;
  }

  const membership = await db.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: deviceSession.organizationId,
        userId: deviceSession.userId,
      },
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    user: deviceSession.user,
    activeOrganization: deviceSession.organization,
    membership,
    role: membership.role,
    deviceSession: {
      id: deviceSession.id,
      organizationId: deviceSession.organizationId,
      userId: deviceSession.userId,
      lastSeenAt: deviceSession.lastSeenAt,
      expiresAt: deviceSession.expiresAt,
    },
  };
}

export async function getCurrentOrganizationMembershipContext() {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    return null;
  }

  return {
    activeOrganization: authContext.activeOrganization,
    membership: authContext.membership,
    role: authContext.role,
  };
}
