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
  AdminEditUserFormErrors,
  ValidAdminEditUserInput,
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

export type SetAdminEnrollmentStatusResult =
  | {
      ok: true;
      enrollmentId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type UpdateAdminManagedUserResult =
  | {
      ok: true;
      membershipId: string;
      userId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: AdminEditUserFormErrors;
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

export async function updateAdminManagedUser(
  authContext: AdminAuthContext,
  membershipId: string,
  input: ValidAdminEditUserInput,
): Promise<UpdateAdminManagedUserResult> {
  if (
    authContext.role !== MembershipRole.ORG_ADMIN &&
    authContext.role !== MembershipRole.SUPER_ADMIN
  ) {
    return {
      ok: false,
      message: "Bu işlem için kurum yöneticisi yetkisi gerekir.",
    };
  }

  const organizationId = getAdminOrganizationId(authContext);
  const normalizedMembershipId = membershipId.trim();

  if (!normalizedMembershipId) {
    return {
      ok: false,
      message: "Düzenlenecek kullanıcı seçilmelidir.",
    };
  }

  try {
    return await db.$transaction(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: {
          id: normalizedMembershipId,
          organizationId,
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });

      if (!membership) {
        return {
          ok: false,
          message: "Kullanıcı kurumunuzda bulunamadı.",
        };
      }

      const updatedUser = await tx.user.update({
        where: {
          id: membership.userId,
        },
        data: {
          name: input.name,
          email: input.email,
          status: input.status,
        },
        select: {
          id: true,
        },
      });

      await tx.membership.update({
        where: {
          id_organizationId: {
            id: membership.id,
            organizationId,
          },
        },
        data: {
          studentNo:
            membership.role === MembershipRole.STUDENT
              ? input.studentNo
              : undefined,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action:
            input.status === UserStatus.ACTIVE
              ? "user.updated"
              : "user.deactivated",
          targetType: "User",
          targetId: updatedUser.id,
          metadata: {
            membershipId: membership.id,
            role: membership.role,
            status: input.status,
          },
        },
      });

      return {
        ok: true,
        membershipId: membership.id,
        userId: updatedUser.id,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu e-posta adresi başka bir kullanıcıda kayıtlı.",
        errors: {
          email: "Bu e-posta adresi başka bir kullanıcıda kayıtlı.",
        },
      };
    }

    return {
      ok: false,
      message: "Kullanıcı şu anda güncellenemedi. Lütfen tekrar deneyin.",
    };
  }
}

export async function setAdminStudentEnrollmentStatus(
  authContext: AdminAuthContext,
  enrollmentId: string,
  status: Extract<EnrollmentStatus, "ACTIVE" | "INACTIVE">,
): Promise<SetAdminEnrollmentStatusResult> {
  if (
    authContext.role !== MembershipRole.ORG_ADMIN &&
    authContext.role !== MembershipRole.SUPER_ADMIN
  ) {
    return {
      ok: false,
      message: "Bu işlem için kurum yöneticisi yetkisi gerekir.",
    };
  }

  const organizationId = getAdminOrganizationId(authContext);
  const normalizedEnrollmentId = enrollmentId.trim();

  if (!normalizedEnrollmentId) {
    return {
      ok: false,
      message: "Güncellenecek kayıt seçilmelidir.",
    };
  }

  try {
    const enrollment = await db.enrollment.findFirst({
      where: {
        id: normalizedEnrollmentId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
        sectionId: true,
        studentMembershipId: true,
      },
    });

    if (!enrollment) {
      return {
        ok: false,
        message: "Kayıt bulunamadı.",
      };
    }

    if (enrollment.status === status) {
      return {
        ok: true,
        enrollmentId: enrollment.id,
      };
    }

    const updatedEnrollment = await db.enrollment.update({
      where: {
        id_organizationId: {
          id: enrollment.id,
          organizationId,
        },
      },
      data: {
        status,
        endedAt: status === EnrollmentStatus.INACTIVE ? new Date() : null,
      },
      select: {
        id: true,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        actorUserId: authContext.user.id,
        action:
          status === EnrollmentStatus.ACTIVE
            ? "enrollment.reactivated"
            : "enrollment.deactivated",
        targetType: "Enrollment",
        targetId: updatedEnrollment.id,
        metadata: {
          sectionId: enrollment.sectionId,
          studentMembershipId: enrollment.studentMembershipId,
        },
      },
    });

    return {
      ok: true,
      enrollmentId: updatedEnrollment.id,
    };
  } catch {
    return {
      ok: false,
      message: "Öğrenci kaydı şu anda güncellenemedi.",
    };
  }
}
