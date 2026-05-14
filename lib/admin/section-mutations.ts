import "server-only";

import { MembershipRole, UserStatus } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
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
          message: "Seçilen öğretmen kurumunuza ait değil.",
          errors: {
            instructorMembershipId: "Seçilen öğretmen kurumunuza ait değil.",
          },
        };
      }

      if (instructorMembership.role !== MembershipRole.INSTRUCTOR) {
        return {
          ok: false,
          message: "Bu kullanıcı öğretmen rolüne sahip değil.",
          errors: {
            instructorMembershipId: "Bu kullanıcı öğretmen rolüne sahip değil.",
          },
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmeni seçin.",
          errors: {
            instructorMembershipId: "Kurumunuzdaki aktif bir öğretmeni seçin.",
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
            instructorMembershipId: instructorMembership.id,
            isActive: input.isActive,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.instructor_assigned",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            instructorMembershipId: instructorMembership.id,
            instructorUserId: instructorMembership.userId,
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
      message: "Ders grubu ve öğretmen seçilmelidir.",
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
          message: "Seçilen öğretmen kurumunuza ait değil.",
        };
      }

      if (instructorMembership.role !== MembershipRole.INSTRUCTOR) {
        return {
          ok: false,
          message: "Bu kullanıcı öğretmen rolüne sahip değil.",
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmeni seçin.",
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
          action: "section.instructor_assigned",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            instructorMembershipId: instructorMembership.id,
            instructorUserId: instructorMembership.userId,
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
      message: "Öğretmen ataması şu anda yapılamadı.",
    };
  }
}
