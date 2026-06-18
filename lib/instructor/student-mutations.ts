import "server-only";

import {
  EnrollmentStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
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

export type AssignInstructorStudentToSectionResult =
  | {
      ok: true;
      enrollmentId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type DeactivateInstructorEnrollmentResult =
  | {
      ok: true;
      enrollmentId: string;
    }
  | {
      ok: false;
      message: string;
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

export async function assignInstructorStudentToSection(
  authContext: InstructorAuthContext,
  input: {
    studentMembershipId: string;
    sectionId: string;
  },
): Promise<AssignInstructorStudentToSectionResult> {
  if (authContext.role !== MembershipRole.INSTRUCTOR) {
    return {
      ok: false,
      message: "Bu işlem için öğretmen yetkisi gerekir.",
    };
  }

  const organizationId = getInstructorOrganizationId(authContext);
  const studentMembershipId = input.studentMembershipId.trim();
  const sectionId = input.sectionId.trim();

  if (!studentMembershipId || !sectionId) {
    return {
      ok: false,
      message: "Öğrenci ve şube seçimi gereklidir.",
    };
  }

  try {
    return await db.$transaction(async (tx) => {
      const [studentMembership, section] = await Promise.all([
        tx.membership.findFirst({
          where: {
            id: studentMembershipId,
            organizationId,
            role: MembershipRole.STUDENT,
          },
          select: {
            id: true,
            userId: true,
          },
        }),
        tx.section.findFirst({
          where: {
            id: sectionId,
            organizationId,
            isActive: true,
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!studentMembership) {
        return {
          ok: false,
          message: "Bu kurumda geçerli bir öğrenci seçin.",
        };
      }

      if (!section) {
        return {
          ok: false,
          message: "Bu kurumda aktif bir şube seçin.",
        };
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          organizationId_sectionId_studentMembershipId: {
            organizationId,
            sectionId: section.id,
            studentMembershipId: studentMembership.id,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (existingEnrollment?.status === EnrollmentStatus.ACTIVE) {
        return {
          ok: true,
          enrollmentId: existingEnrollment.id,
        };
      }

      const enrollment = existingEnrollment
        ? await tx.enrollment.update({
            where: {
              id_organizationId: {
                id: existingEnrollment.id,
                organizationId,
              },
            },
            data: {
              status: EnrollmentStatus.ACTIVE,
              endedAt: null,
            },
            select: {
              id: true,
            },
          })
        : await tx.enrollment.create({
            data: {
              organizationId,
              sectionId: section.id,
              studentMembershipId: studentMembership.id,
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
          action: existingEnrollment
            ? "enrollment.reactivated"
            : "enrollment.assigned",
          targetType: "Enrollment",
          targetId: enrollment.id,
          metadata: {
            sectionId: section.id,
            studentMembershipId: studentMembership.id,
            studentUserId: studentMembership.userId,
          },
        },
      });

      return {
        ok: true,
        enrollmentId: enrollment.id,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu öğrenci bu şubeye zaten kayıtlı.",
      };
    }

    return {
      ok: false,
      message: "Öğrenci şu anda şubeye atanamadı. Lütfen tekrar deneyin.",
    };
  }
}

export async function deactivateInstructorEnrollment(
  authContext: InstructorAuthContext,
  enrollmentId: string,
): Promise<DeactivateInstructorEnrollmentResult> {
  if (authContext.role !== MembershipRole.INSTRUCTOR) {
    return {
      ok: false,
      message: "Bu işlem için öğretmen yetkisi gerekir.",
    };
  }

  const organizationId = getInstructorOrganizationId(authContext);
  const normalizedEnrollmentId = enrollmentId.trim();

  if (!normalizedEnrollmentId) {
    return {
      ok: false,
      message: "Pasifleştirilecek kayıt seçilmelidir.",
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

    if (enrollment.status === EnrollmentStatus.INACTIVE) {
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
        status: EnrollmentStatus.INACTIVE,
        endedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        actorUserId: authContext.user.id,
        action: "enrollment.deactivated",
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
      message: "Öğrenci kaydı şu anda pasifleştirilemedi.",
    };
  }
}
