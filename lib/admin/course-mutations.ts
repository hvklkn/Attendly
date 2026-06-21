import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import type {
  AdminCourseCreateFormErrors,
  ValidAdminCourseCreateInput,
} from "@/lib/admin/course-create";

export type CreateAdminCourseResult =
  | {
      ok: true;
      courseId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: AdminCourseCreateFormErrors;
    };

export type UpdateAdminCourseResult = CreateAdminCourseResult;

export type SetAdminCourseActiveResult =
  | {
      ok: true;
      courseId: string;
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

export async function createAdminCourse(
  authContext: AdminAuthContext,
  input: ValidAdminCourseCreateInput,
): Promise<CreateAdminCourseResult> {
  const organizationId = getAdminOrganizationId(authContext);

  try {
    const course = await db.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          organizationId,
          code: input.code,
          title: input.title,
          description: input.description,
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
          action: "course.created",
          targetType: "Course",
          targetId: createdCourse.id,
          metadata: {
            isActive: input.isActive,
          },
        },
      });

      return createdCourse;
    });

    return {
      ok: true,
      courseId: course.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu ders / kurs kodu kurumunuzda zaten kullanılıyor.",
        errors: {
          code: "Bu ders / kurs kodu kurumunuzda zaten kullanılıyor.",
        },
      };
    }

    return {
      ok: false,
      message: "Ders / kurs şu anda oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}

export async function updateAdminCourse(
  authContext: AdminAuthContext,
  courseId: string,
  input: ValidAdminCourseCreateInput,
): Promise<UpdateAdminCourseResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedCourseId = courseId.trim();

  if (!normalizedCourseId) {
    return {
      ok: false,
      message: "Düzenlenecek ders / kurs seçilmelidir.",
    };
  }

  try {
    const course = await db.$transaction(async (tx) => {
      const existingCourse = await tx.course.findFirst({
        where: {
          id: normalizedCourseId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!existingCourse) {
        return null;
      }

      const updatedCourse = await tx.course.update({
        where: {
          id_organizationId: {
            id: existingCourse.id,
            organizationId,
          },
        },
        data: {
          code: input.code,
          title: input.title,
          description: input.description,
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
          action: "course.updated",
          targetType: "Course",
          targetId: updatedCourse.id,
          metadata: {
            isActive: input.isActive,
          },
        },
      });

      return updatedCourse;
    });

    if (!course) {
      return {
        ok: false,
        message: "Ders / kurs bulunamadı.",
      };
    }

    return {
      ok: true,
      courseId: course.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu ders / kurs kodu kurumunuzda zaten kullanılıyor.",
        errors: {
          code: "Bu ders / kurs kodu kurumunuzda zaten kullanılıyor.",
        },
      };
    }

    return {
      ok: false,
      message: "Ders / kurs şu anda güncellenemedi. Lütfen tekrar deneyin.",
    };
  }
}

export async function setAdminCourseActive(
  authContext: AdminAuthContext,
  courseId: string,
  isActive: boolean,
): Promise<SetAdminCourseActiveResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedCourseId = courseId.trim();

  if (!normalizedCourseId) {
    return {
      ok: false,
      message: "Güncellenecek ders / kurs seçilmelidir.",
    };
  }

  try {
    const course = await db.$transaction(async (tx) => {
      const existingCourse = await tx.course.findFirst({
        where: {
          id: normalizedCourseId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!existingCourse) {
        return null;
      }

      const updatedCourse = await tx.course.update({
        where: {
          id_organizationId: {
            id: existingCourse.id,
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
          action: isActive ? "course.reactivated" : "course.deactivated",
          targetType: "Course",
          targetId: updatedCourse.id,
        },
      });

      return updatedCourse;
    });

    if (!course) {
      return {
        ok: false,
        message: "Ders / kurs bulunamadı.",
      };
    }

    return {
      ok: true,
      courseId: course.id,
    };
  } catch {
    return {
      ok: false,
      message: "Ders / kurs durumu güncellenemedi.",
    };
  }
}
