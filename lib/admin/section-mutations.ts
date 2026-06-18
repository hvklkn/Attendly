import "server-only";

import {
  EnrollmentStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { isSectionResponsibleRole } from "@/lib/admin/section-responsible";
import { db } from "@/lib/db";
import type {
  AdminSectionCreateFormErrors,
  ValidAdminSectionCreateInput,
} from "@/lib/admin/section-create";

export type CreateAdminSectionResult =
  | {
      ok: true;
      sectionId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: AdminSectionCreateFormErrors;
    };

export type AssignAdminSectionInstructorResult =
  | {
      ok: true;
      sectionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type AssignAdminSectionStudentResult =
  | {
      ok: true;
      sectionId: string;
      enrollmentId: string;
      alreadyAssigned: boolean;
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

export async function createAdminSection(
  authContext: AdminAuthContext,
  input: ValidAdminSectionCreateInput,
): Promise<CreateAdminSectionResult> {
  const organizationId = getAdminOrganizationId(authContext);

  try {
    return await db.$transaction(async (tx) => {
      const [course, instructorMembership] = await Promise.all([
        tx.course.findFirst({
          where: {
            id: input.courseId,
            organizationId,
            isActive: true,
          },
          select: {
            id: true,
          },
        }),
        tx.membership.findFirst({
          where: {
            id: input.instructorMembershipId,
            organizationId,
          },
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                status: true,
              },
            },
          },
        }),
      ]);

      if (!course) {
        return {
          ok: false,
          message: "Bu ders / kurs kurumunuza ait değil.",
          errors: {
            courseId: "Bu ders / kurs kurumunuza ait değil.",
          },
        };
      }

      if (!instructorMembership) {
        return {
          ok: false,
          message: "Seçilen sorumlu kişi kurumunuza ait değil.",
          errors: {
            instructorMembershipId:
              "Seçilen sorumlu kişi kurumunuza ait değil.",
          },
        };
      }

      if (!isSectionResponsibleRole(instructorMembership.role)) {
        return {
          ok: false,
          message: "Bu kullanıcı ders grubu sorumlusu olamaz.",
          errors: {
            instructorMembershipId:
              "Bu kullanıcı ders grubu sorumlusu olamaz.",
          },
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmen veya yönetici seçin.",
          errors: {
            instructorMembershipId:
              "Kurumunuzdaki aktif bir öğretmen veya yönetici seçin.",
          },
        };
      }

      const section = await tx.section.create({
        data: {
          organizationId,
          courseId: course.id,
          instructorMembershipId: instructorMembership.id,
          name: input.name,
          code: input.code,
          isActive: input.isActive,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.created",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            courseId: course.id,
            responsibleMembershipId: instructorMembership.id,
            responsibleRole: instructorMembership.role,
            isActive: input.isActive,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.responsible_assigned",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            responsibleMembershipId: instructorMembership.id,
            responsibleUserId: instructorMembership.userId,
            responsibleRole: instructorMembership.role,
          },
        },
      });

      return {
        ok: true,
        sectionId: section.id,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu ders grubu kodu kurumunuzda zaten kullanılıyor.",
        errors: {
          code: "Bu ders grubu kodu kurumunuzda zaten kullanılıyor.",
        },
      };
    }

    return {
      ok: false,
      message: "Ders grubu şu anda oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}

export async function assignAdminSectionInstructor(
  authContext: AdminAuthContext,
  input: {
    sectionId: string;
    instructorMembershipId: string;
  },
): Promise<AssignAdminSectionInstructorResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const sectionId = input.sectionId.trim();
  const instructorMembershipId = input.instructorMembershipId.trim();

  if (!sectionId || !instructorMembershipId) {
    return {
      ok: false,
      message: "Ders grubu ve sorumlu kişi seçilmelidir.",
    };
  }

  try {
    return await db.$transaction(async (tx) => {
      const [section, instructorMembership] = await Promise.all([
        tx.section.findFirst({
          where: {
            id: sectionId,
            organizationId,
          },
          select: {
            id: true,
          },
        }),
        tx.membership.findFirst({
          where: {
            id: instructorMembershipId,
            organizationId,
          },
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                status: true,
              },
            },
          },
        }),
      ]);

      if (!section) {
        return {
          ok: false,
          message: "Ders grubu bulunamadı.",
        };
      }

      if (!instructorMembership) {
        return {
          ok: false,
          message: "Seçilen sorumlu kişi kurumunuza ait değil.",
        };
      }

      if (!isSectionResponsibleRole(instructorMembership.role)) {
        return {
          ok: false,
          message: "Bu kullanıcı ders grubu sorumlusu olamaz.",
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmen veya yönetici seçin.",
        };
      }

      await tx.section.update({
        where: {
          id_organizationId: {
            id: section.id,
            organizationId,
          },
        },
        data: {
          instructorMembershipId: instructorMembership.id,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.responsible_assigned",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            responsibleMembershipId: instructorMembership.id,
            responsibleUserId: instructorMembership.userId,
            responsibleRole: instructorMembership.role,
          },
        },
      });

      return {
        ok: true,
        sectionId: section.id,
      };
    });
  } catch {
    return {
      ok: false,
      message: "Sorumlu kişi ataması şu anda yapılamadı.",
    };
  }
}

export async function assignAdminSectionStudent(
  authContext: AdminAuthContext,
  input: {
    sectionId: string;
    studentMembershipId: string;
  },
): Promise<AssignAdminSectionStudentResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const sectionId = input.sectionId.trim();
  const studentMembershipId = input.studentMembershipId.trim();

  if (!sectionId || !studentMembershipId) {
    return {
      ok: false,
      message: "Ders grubu ve öğrenci seçilmelidir.",
    };
  }

  try {
    return await db.$transaction(async (tx) => {
      const [section, studentMembership] = await Promise.all([
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
        tx.membership.findFirst({
          where: {
            id: studentMembershipId,
            organizationId,
            role: MembershipRole.STUDENT,
          },
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                status: true,
              },
            },
          },
        }),
      ]);

      if (!section) {
        return {
          ok: false,
          message: "Aktif ders grubu bulunamadı.",
        };
      }

      if (!studentMembership) {
        return {
          ok: false,
          message: "Seçilen öğrenci kurumunuzda bulunamadı.",
        };
      }

      if (studentMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Yalnızca aktif öğrenciler ders grubuna atanabilir.",
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
          sectionId: section.id,
          enrollmentId: existingEnrollment.id,
          alreadyAssigned: true,
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
            ? "enrollment.reactivated_by_admin"
            : "enrollment.assigned_by_admin",
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
        sectionId: section.id,
        enrollmentId: enrollment.id,
        alreadyAssigned: false,
      };
    });
  } catch {
    return {
      ok: false,
      message: "Öğrenci ataması şu anda yapılamadı.",
    };
  }
}
