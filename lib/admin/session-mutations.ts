import "server-only";

import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import {
  issueAttendanceSessionQrToken,
  type IssueAttendanceSessionQrTokenResult,
} from "@/lib/qr-issuance";
import type {
  CreateSessionFormErrors,
  ValidCreateSessionInput,
} from "@/lib/admin/session-create";

export type CreateAdminSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: CreateSessionFormErrors;
    };

export type IssueAdminSessionQrTokenResult =
  IssueAttendanceSessionQrTokenResult;

export async function createAdminAttendanceSession(
  authContext: AdminAuthContext,
  input: ValidCreateSessionInput,
): Promise<CreateAdminSessionResult> {
  const organizationId = getAdminOrganizationId(authContext);

  try {
    const section = await db.section.findFirst({
      where: {
        id: input.sectionId,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!section) {
      return {
        ok: false,
        message: "Bu kurumdan aktif bir şube seçin.",
        errors: {
          sectionId: "Bu kurumdan aktif bir şube seçin.",
        },
      };
    }

    if (input.courseId && section.courseId !== input.courseId) {
      return {
        ok: false,
        message: "Seçilen ders seçilen şube ile eşleşmiyor.",
        errors: {
          courseId: "Seçilen şubenin bağlı olduğu dersi seçin.",
          sectionId: "Seçilen ders için bir şube seçin.",
        },
      };
    }

    let roomId: string | null = null;

    if (input.roomId) {
      const room = await db.room.findFirst({
        where: {
          id: input.roomId,
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!room) {
        return {
          ok: false,
          message:
            "Bu kurumdan aktif bir oda seçin veya alanı boş bırakın.",
          errors: {
            roomId:
              "Bu kurumdan aktif bir oda seçin veya alanı boş bırakın.",
          },
        };
      }

      roomId = room.id;
    }

    const session = await db.attendanceSession.create({
      data: {
        organizationId,
        sectionId: section.id,
        roomId,
        createdByMembershipId: authContext.membership.id,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        lateThresholdMinutes: input.lateThresholdMinutes,
        status: AttendanceSessionStatus.SCHEDULED,
      },
      select: {
        id: true,
      },
    });

    return {
      ok: true,
      sessionId: session.id,
    };
  } catch {
    return {
      ok: false,
      message:
        "Oturum şu anda oluşturulamadı. Lütfen formu kontrol edip tekrar deneyin.",
    };
  }
}

export async function issueAdminSessionQrToken(
  authContext: AdminAuthContext,
  sessionId: string,
): Promise<IssueAdminSessionQrTokenResult> {
  const organizationId = getAdminOrganizationId(authContext);

  return issueAttendanceSessionQrToken(authContext, {
    sessionId,
    organizationId,
  });
}
