import "server-only";

import {
  EnrollmentStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type {
  AdminCreatableUserRole,
  AdminCreateUserFormErrors,
  ValidAdminCreateUserInput,
} from "@/lib/admin/user-create";

const ADMIN_CREATABLE_ROLES = new Set<AdminCreatableUserRole>([
  MembershipRole.ORG_ADMIN,
  MembershipRole.INSTRUCTOR,
  MembershipRole.STUDENT,
]);

export type CreateAdminManagedUserResult =
  | {
      ok: true;
      userId: string;
      membershipId: string;
      createdUser: boolean;
      createdMembership: boolean;
    }
  | {
      ok: false;
      message: string;
      errors?: AdminCreateUserFormErrors;
    };

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createAdminManagedUser(
  authContext: AdminAuthContext,
  input: ValidAdminCreateUserInput,
): Promise<CreateAdminManagedUserResult> {
  if (
    authContext.role !== MembershipRole.ORG_ADMIN &&
    authContext.role !== MembershipRole.SUPER_ADMIN
  ) {
    return {
      ok: false,
      message: "Bu işlem için kurum yöneticisi yetkisi gerekir.",
    };
  }

  if (!ADMIN_CREATABLE_ROLES.has(input.role)) {
    return {
      ok: false,
      message: "Bu rol için yetkiniz yok.",
      errors: {
        role: "Bu rol için yetkiniz yok.",
      },
    };
  }

  const organizationId = getAdminOrganizationId(authContext);
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
          email: true,
          status: true,
          memberships: {
            where: {
              organizationId,
            },
            select: {
              id: true,
              role: true,
            },
          },
        },
      });

      if (
        existingUser &&
        (existingUser.status === UserStatus.SUSPENDED ||
          existingUser.status === UserStatus.ARCHIVED)
      ) {
        return {
          ok: false,
          message:
            "Bu e-posta adresi pasif bir kullanıcıya ait. Lütfen destek ile görüşün.",
          errors: {
            email:
              "Bu e-posta adresi pasif bir kullanıcıya ait. Lütfen destek ile görüşün.",
          },
        };
      }

      const existingMembership = existingUser?.memberships[0] ?? null;

      if (
        existingMembership &&
        (input.role !== MembershipRole.STUDENT ||
          existingMembership.role !== MembershipRole.STUDENT)
      ) {
        return {
          ok: false,
          message: "Bu kullanıcı kurumunuzda zaten kayıtlı.",
          errors: {
            email: "Bu kullanıcı kurumunuzda zaten kayıtlı.",
          },
        };
      }

      if (
        existingMembership &&
        input.role === MembershipRole.STUDENT &&
        input.sectionIds.length === 0
      ) {
        return {
          ok: false,
          message:
            "Bu öğrenci kurumunuzda zaten kayıtlı. Yeni bir ders grubu seçin.",
          errors: {
            sectionIds: "Öğrenciyi eklemek için en az bir ders grubu seçin.",
          },
        };
      }

      const user = existingUser
        ? existingUser
        : await tx.user.create({
            data: {
              email: input.email,
              name: input.name,
              passwordHash,
              status:
                input.status === "ACTIVE"
                  ? UserStatus.ACTIVE
                  : UserStatus.INVITED,
            },
            select: {
              id: true,
              email: true,
              status: true,
              memberships: {
                where: {
                  organizationId,
                },
                select: {
                  id: true,
                  role: true,
                },
              },
            },
          });

      const membership =
        existingMembership ??
        (await tx.membership.create({
          data: {
            organizationId,
            userId: user.id,
            role: input.role,
          },
          select: {
            id: true,
            role: true,
          },
        }));

      const selectedSectionIds = Array.from(new Set(input.sectionIds));

      if (input.role === MembershipRole.STUDENT && selectedSectionIds.length) {
        const sections = await tx.section.findMany({
          where: {
            organizationId,
            id: {
              in: selectedSectionIds,
            },
            isActive: true,
          },
          select: {
            id: true,
          },
        });
        const sectionIdSet = new Set(sections.map((section) => section.id));

        if (sections.length !== selectedSectionIds.length) {
          return {
            ok: false,
            message: "Seçilen ders gruplarından biri kurumunuza ait değil.",
            errors: {
              sectionIds:
                "Yalnızca kurumunuzdaki aktif ders gruplarını seçin.",
            },
          };
        }

        const duplicateEnrollment = await tx.enrollment.findFirst({
          where: {
            organizationId,
            sectionId: {
              in: selectedSectionIds,
            },
            studentMembershipId: membership.id,
          },
          select: {
            id: true,
          },
        });

        if (duplicateEnrollment) {
          return {
            ok: false,
            message: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
            errors: {
              sectionIds: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
            },
          };
        }

        for (const sectionId of selectedSectionIds) {
          if (!sectionIdSet.has(sectionId)) {
            continue;
          }

          const enrollment = await tx.enrollment.create({
            data: {
              organizationId,
              sectionId,
              studentMembershipId: membership.id,
              status: EnrollmentStatus.ACTIVE,
            },
            select: {
              id: true,
            },
          });

          await tx.auditLog.create({
            data: {
              organizationId,
              actorUserId: authContext.user.id,
              action: "enrollment.created",
              targetType: "Enrollment",
              targetId: enrollment.id,
              metadata: {
                sectionId,
                studentMembershipId: membership.id,
                studentUserId: user.id,
              },
            },
          });
        }
      }

      if (!existingUser) {
        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: authContext.user.id,
            action: "user.created",
            targetType: "User",
            targetId: user.id,
            metadata: {
              role: input.role,
            },
          },
        });
      }

      if (!existingMembership) {
        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: authContext.user.id,
            action: "membership.created",
            targetType: "Membership",
            targetId: membership.id,
            metadata: {
              role: input.role,
              userId: user.id,
              createdUser: !existingUser,
            },
          },
        });
      }

      return {
        ok: true,
        userId: user.id,
        membershipId: membership.id,
        createdUser: !existingUser,
        createdMembership: !existingMembership,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu e-posta adresi zaten kullanılıyor.",
        errors: {
          email: "Bu e-posta adresi zaten kullanılıyor.",
        },
      };
    }

    return {
      ok: false,
      message: "Kullanıcı şu anda oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}
