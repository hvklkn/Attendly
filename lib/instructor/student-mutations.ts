import "server-only";

import { MembershipRole, UserStatus } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type {
  InstructorStudentCreateFormErrors,
  ValidInstructorStudentCreateInput,
} from "@/lib/instructor/student-create";

export type CreateInstructorStudentEnrollmentResult =
  | {
      ok: true;
      userId: string;
      membershipId: string;
      enrollmentId: string;
      createdUser: boolean;
      createdMembership: boolean;
    }
  | {
      ok: false;
      message: string;
      errors?: InstructorStudentCreateFormErrors;
    };

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createInstructorStudentEnrollment(
  authContext: InstructorAuthContext,
  input: ValidInstructorStudentCreateInput,
): Promise<CreateInstructorStudentEnrollmentResult> {
  if (authContext.role !== MembershipRole.INSTRUCTOR) {
    return {
      ok: false,
      message: "Bu işlem için öğretmen yetkisi gerekir.",
    };
  }

  const organizationId = getInstructorOrganizationId(authContext);

  try {
    return await db.$transaction(async (tx) => {
      const section = await tx.section.findFirst({
        where: {
          id: input.sectionId,
          organizationId,
          instructorMembershipId: authContext.membership.id,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!section) {
        return {
          ok: false,
          message: "Kendi ders gruplarınızdan birini seçin.",
          errors: {
            sectionId: "Kendi ders gruplarınızdan birini seçin.",
          },
        };
      }

      const existingUser = await tx.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
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
            "Bu e-posta adresi pasif bir kullanıcıya ait. Lütfen kurum yöneticinizle görüşün.",
          errors: {
            email:
              "Bu e-posta adresi pasif bir kullanıcıya ait. Lütfen kurum yöneticinizle görüşün.",
          },
        };
      }

      const existingMembership = existingUser?.memberships[0] ?? null;

      if (
        existingMembership &&
        existingMembership.role !== MembershipRole.STUDENT
      ) {
        return {
          ok: false,
          message: "Bu e-posta adresi zaten kullanılıyor.",
          errors: {
            email: "Bu e-posta adresi zaten kullanılıyor.",
          },
        };
      }

      const passwordHash = existingUser
        ? null
        : await hashPassword(input.password);

      const user = existingUser
        ? existingUser
        : await tx.user.create({
            data: {
              email: input.email,
              name: input.name,
              passwordHash,
              status: UserStatus.ACTIVE,
            },
            select: {
              id: true,
              status: true,
            },
          });

      const membership =
        existingMembership ??
        (await tx.membership.create({
          data: {
            organizationId,
            userId: user.id,
            role: MembershipRole.STUDENT,
          },
          select: {
            id: true,
            role: true,
          },
        }));

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          organizationId_sectionId_studentMembershipId: {
            organizationId,
            sectionId: section.id,
            studentMembershipId: membership.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingEnrollment) {
        return {
          ok: false,
          message: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
          errors: {
            sectionId: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
          },
        };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          organizationId,
          sectionId: section.id,
          studentMembershipId: membership.id,
          status: input.enrollmentStatus,
        },
        select: {
          id: true,
        },
      });

      if (!existingUser) {
        await tx.auditLog.create({
          data: {
            organizationId,
            actorUserId: authContext.user.id,
            action: "user.created",
            targetType: "User",
            targetId: user.id,
            metadata: {
              role: MembershipRole.STUDENT,
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
              role: MembershipRole.STUDENT,
              userId: user.id,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "enrollment.created",
          targetType: "Enrollment",
          targetId: enrollment.id,
          metadata: {
            sectionId: section.id,
            studentMembershipId: membership.id,
            studentUserId: user.id,
          },
        },
      });

      return {
        ok: true,
        userId: user.id,
        membershipId: membership.id,
        enrollmentId: enrollment.id,
        createdUser: !existingUser,
        createdMembership: !existingMembership,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
        errors: {
          sectionId: "Bu öğrenci bu ders grubuna zaten kayıtlı.",
        },
      };
    }

    return {
      ok: false,
      message: "Öğrenci şu anda eklenemedi. Lütfen tekrar deneyin.",
    };
  }
}
