import "server-only";

import { MembershipRole, OrganizationStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { createDeviceSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

const rolePriority: Record<MembershipRole, number> = {
  SUPER_ADMIN: 0,
  ORG_ADMIN: 1,
  INSTRUCTOR: 2,
  STUDENT: 3,
};

type LoginResult =
  | {
      ok: true;
      token: string;
      role: MembershipRole;
    }
  | {
      ok: false;
      reason: "INVALID_CREDENTIALS" | "NO_ACTIVE_MEMBERSHIP";
    };

export async function loginWithPassword(input: {
  email: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      status: true,
      passwordHash: true,
      memberships: {
        select: {
          id: true,
          organizationId: true,
          role: true,
          organization: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    !user.passwordHash ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
    return {
      ok: false,
      reason: "INVALID_CREDENTIALS",
    };
  }

  const membership = user.memberships
    .filter((item) => item.organization.status === OrganizationStatus.ACTIVE)
    .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])[0];

  if (!membership) {
    return {
      ok: false,
      reason: "NO_ACTIVE_MEMBERSHIP",
    };
  }

  const session = await createDeviceSession({
    userId: user.id,
    organizationId: membership.organizationId,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  return {
    ok: true,
    token: session.token,
    role: membership.role,
  };
}
