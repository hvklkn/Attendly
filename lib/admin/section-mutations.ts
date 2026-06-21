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

export type UpdateAdminSectionResult = CreateAdminSectionResult;

export type SetAdminSectionActiveResult =
  | {
      ok: true;
      sectionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type AssignAdminSectionInstructorResult =
  | {
      ok: true;
      sectionId: string;
      alreadyAssigned: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export type UnassignAdminSectionInstructorResult =
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
            role: MembershipRole.INSTRUCTOR,
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

      if (!isSectionResponsibleRole(instructorMembership.role)) {
        return {
          ok: false,
          message: "Bu kullanıcı öğretmen olarak atanamaz.",
          errors: {
            instructorMembershipId: "Bu kullanıcı öğretmen olarak atanamaz.",
          },
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmen seçin.",
          errors: {
            instructorMembershipId:
              "Kurumunuzdaki aktif bir öğretmen seçin.",
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

      await tx.instructorSectionAssignment.upsert({
        where: {
          organizationId_instructorMembershipId_sectionId: {
            organizationId,
            instructorMembershipId: instructorMembership.id,
            sectionId: section.id,
          },
        },
        update: {
          isActive: true,
          assignedAt: new Date(),
        },
        create: {
          organizationId,
          instructorMembershipId: instructorMembership.id,
          sectionId: section.id,
          isActive: true,
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

export async function updateAdminSection(
  authContext: AdminAuthContext,
  sectionId: string,
  input: ValidAdminSectionCreateInput,
): Promise<UpdateAdminSectionResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedSectionId = sectionId.trim();

  if (!normalizedSectionId) {
    return {
      ok: false,
      message: "Düzenlenecek ders grubu seçilmelidir.",
    };
  }

  try {
    return await db.$transaction(async (tx) => {
      const [section, course, instructorMembership] = await Promise.all([
        tx.section.findFirst({
          where: {
            id: normalizedSectionId,
            organizationId,
          },
          select: {
            id: true,
          },
        }),
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
            role: MembershipRole.INSTRUCTOR,
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

      if (!course) {
        return {
          ok: false,
          message: "Bu ders / kurs kurumunuza ait veya aktif değil.",
          errors: {
            courseId: "Aktif bir ders / kurs seçin.",
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

      if (!isSectionResponsibleRole(instructorMembership.role)) {
        return {
          ok: false,
          message: "Bu kullanıcı öğretmen olarak atanamaz.",
          errors: {
            instructorMembershipId: "Bu kullanıcı öğretmen olarak atanamaz.",
          },
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmen seçin.",
          errors: {
            instructorMembershipId:
              "Kurumunuzdaki aktif bir öğretmen seçin.",
          },
        };
      }

      const updatedSection = await tx.section.update({
        where: {
          id_organizationId: {
            id: section.id,
            organizationId,
          },
        },
        data: {
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

      await tx.instructorSectionAssignment.upsert({
        where: {
          organizationId_instructorMembershipId_sectionId: {
            organizationId,
            instructorMembershipId: instructorMembership.id,
            sectionId: updatedSection.id,
          },
        },
        update: {
          isActive: true,
          assignedAt: new Date(),
        },
        create: {
          organizationId,
          instructorMembershipId: instructorMembership.id,
          sectionId: updatedSection.id,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.updated",
          targetType: "Section",
          targetId: updatedSection.id,
          metadata: {
            courseId: course.id,
            responsibleMembershipId: instructorMembership.id,
            responsibleUserId: instructorMembership.userId,
            responsibleRole: instructorMembership.role,
            isActive: input.isActive,
          },
        },
      });

      return {
        ok: true,
        sectionId: updatedSection.id,
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
      message: "Ders grubu şu anda güncellenemedi. Lütfen tekrar deneyin.",
    };
  }
}

export async function setAdminSectionActive(
  authContext: AdminAuthContext,
  sectionId: string,
  isActive: boolean,
): Promise<SetAdminSectionActiveResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedSectionId = sectionId.trim();

  if (!normalizedSectionId) {
    return {
      ok: false,
      message: "Güncellenecek ders grubu seçilmelidir.",
    };
  }

  try {
    const section = await db.$transaction(async (tx) => {
      const existingSection = await tx.section.findFirst({
        where: {
          id: normalizedSectionId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!existingSection) {
        return null;
      }

      const updatedSection = await tx.section.update({
        where: {
          id_organizationId: {
            id: existingSection.id,
            organizationId,
          },
        },
        data: {
          isActive,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: isActive ? "section.reactivated" : "section.deactivated",
          targetType: "Section",
          targetId: updatedSection.id,
        },
      });

      return updatedSection;
    });

    if (!section) {
      return {
        ok: false,
        message: "Ders grubu bulunamadı.",
      };
    }

    return {
      ok: true,
      sectionId: section.id,
    };
  } catch {
    return {
      ok: false,
      message: "Ders grubu durumu güncellenemedi.",
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
      const [section, instructorMembership, existingAssignment] =
        await Promise.all([
          tx.section.findFirst({
            where: {
              id: sectionId,
              organizationId,
              isActive: true,
            },
            select: {
              id: true,
              instructorMembershipId: true,
            },
          }),
          tx.membership.findFirst({
            where: {
              id: instructorMembershipId,
              organizationId,
              role: MembershipRole.INSTRUCTOR,
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
          tx.instructorSectionAssignment.findUnique({
            where: {
              organizationId_instructorMembershipId_sectionId: {
                organizationId,
                instructorMembershipId,
                sectionId,
              },
            },
            select: {
              id: true,
              isActive: true,
            },
          }),
        ]);

      if (!section) {
        return {
          ok: false,
          message: "Aktif ders grubu bulunamadı.",
        };
      }

      if (!instructorMembership) {
        return {
          ok: false,
          message: "Seçilen öğretmen kurumunuza ait değil.",
        };
      }

      if (!isSectionResponsibleRole(instructorMembership.role)) {
        return {
          ok: false,
          message: "Bu kullanıcı öğretmen olarak atanamaz.",
        };
      }

      if (instructorMembership.user.status !== UserStatus.ACTIVE) {
        return {
          ok: false,
          message: "Kurumunuzdaki aktif bir öğretmen seçin.",
        };
      }

      const alreadyAssigned = Boolean(existingAssignment?.isActive);

      await tx.instructorSectionAssignment.upsert({
        where: {
          organizationId_instructorMembershipId_sectionId: {
            organizationId,
            instructorMembershipId: instructorMembership.id,
            sectionId: section.id,
          },
        },
        update: {
          isActive: true,
          assignedAt: new Date(),
        },
        create: {
          organizationId,
          instructorMembershipId: instructorMembership.id,
          sectionId: section.id,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!section.instructorMembershipId) {
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
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: existingAssignment?.isActive
            ? "section.instructor_assignment_duplicate"
            : "section.instructor_assigned",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            instructorMembershipId: instructorMembership.id,
            instructorUserId: instructorMembership.userId,
            instructorRole: instructorMembership.role,
            reactivated: Boolean(
              existingAssignment && !existingAssignment.isActive,
            ),
          },
        },
      });

      return {
        ok: true,
        sectionId: section.id,
        alreadyAssigned,
      };
    });
  } catch {
    return {
      ok: false,
      message: "Öğretmen ataması şu anda yapılamadı.",
    };
  }
}

export async function unassignAdminSectionInstructor(
  authContext: AdminAuthContext,
  input: {
    sectionId: string;
    instructorMembershipId: string;
  },
): Promise<UnassignAdminSectionInstructorResult> {
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
      const [section, assignment] = await Promise.all([
        tx.section.findFirst({
          where: {
            id: sectionId,
            organizationId,
          },
          select: {
            id: true,
            instructorMembershipId: true,
          },
        }),
        tx.instructorSectionAssignment.findUnique({
          where: {
            organizationId_instructorMembershipId_sectionId: {
              organizationId,
              instructorMembershipId,
              sectionId,
            },
          },
          select: {
            id: true,
            isActive: true,
          },
        }),
      ]);

      if (!section) {
        return {
          ok: false,
          message: "Ders grubu bulunamadı.",
        };
      }

      if (!assignment || !assignment.isActive) {
        return {
          ok: true,
          sectionId: section.id,
        };
      }

      await tx.instructorSectionAssignment.update({
        where: {
          id_organizationId: {
            id: assignment.id,
            organizationId,
          },
        },
        data: {
          isActive: false,
        },
        select: {
          id: true,
        },
      });

      if (section.instructorMembershipId === instructorMembershipId) {
        const nextAssignment = await tx.instructorSectionAssignment.findFirst({
          where: {
            organizationId,
            sectionId: section.id,
            isActive: true,
          },
          orderBy: {
            assignedAt: "asc",
          },
          select: {
            instructorMembershipId: true,
          },
        });

        await tx.section.update({
          where: {
            id_organizationId: {
              id: section.id,
              organizationId,
            },
          },
          data: {
            instructorMembershipId:
              nextAssignment?.instructorMembershipId ?? null,
          },
          select: {
            id: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "section.instructor_assignment_deactivated",
          targetType: "Section",
          targetId: section.id,
          metadata: {
            instructorMembershipId,
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
      message: "Öğretmen ataması pasifleştirilemedi.",
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
