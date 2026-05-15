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
