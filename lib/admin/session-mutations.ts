import "server-only";

import {
  AttendanceSessionStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
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

export type StartAdminAttendanceSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
    };

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
      },
      select: {
        id: true,
        courseId: true,
        isActive: true,
        instructorAssignments: {
          where: {
            isActive: true,
            instructorMembership: {
              is: {
                role: MembershipRole.INSTRUCTOR,
                user: {
                  is: {
                    status: UserStatus.ACTIVE,
                  },
                },
              },
            },
          },
          orderBy: {
            assignedAt: "asc",
          },
          select: {
            instructorMembership: {
              select: {
                id: true,
                role: true,
                userId: true,
                user: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!section) {
      return {
        ok: false,
        message: "Bu ders grubu kurumunuza ait değil.",
        errors: {
          sectionId: "Bu ders grubu kurumunuza ait değil.",
        },
      };
    }

    if (!section.isActive) {
      return {
        ok: false,
        message: "Bu ders grubu aktif değil.",
        errors: {
          sectionId: "Aktif bir ders grubu seçin.",
        },
      };
    }

    if (section.instructorAssignments.length === 0) {
      return {
        ok: false,
        message:
          "Bu ders grubuna atanmış öğretmen yok. Yoklama oturumu oluşturmak için önce öğretmen atayın.",
        errors: {
          sectionId: "Bu ders grubuna atanmış öğretmen yok.",
        },
      };
    }

    const responsibleMembership =
      section.instructorAssignments.find(
        (assignment) =>
          assignment.instructorMembership.id === input.instructorMembershipId,
      )?.instructorMembership ??
      section.instructorAssignments[0]?.instructorMembership;

    if (
      input.instructorMembershipId &&
      input.instructorMembershipId !== responsibleMembership?.id
    ) {
      return {
        ok: false,
        message: "Ders grubu ve öğretmen ataması eşleşmiyor.",
        errors: {
          instructorMembershipId:
            "Ders grubuna atanmış öğretmenlerden birini seçin.",
          sectionId: "Ders grubu ve öğretmen ataması eşleşmiyor.",
        },
      };
    }

    if (input.courseId && section.courseId !== input.courseId) {
      return {
        ok: false,
        message: "Seçilen ders seçilen ders grubu ile eşleşmiyor.",
        errors: {
          courseId: "Seçilen ders grubunun bağlı olduğu dersi seçin.",
          sectionId: "Seçilen ders için bir ders grubu seçin.",
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

    const session = await db.$transaction(async (tx) => {
      const createdSession = await tx.attendanceSession.create({
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
          geofenceLatitude: input.geofenceLatitude,
          geofenceLongitude: input.geofenceLongitude,
          geofenceAccuracyMeters: input.geofenceAccuracyMeters,
          geofenceRadiusMeters: input.geofenceRadiusMeters,
          geofenceCapturedAt: input.geofenceCapturedAt,
          geofenceSource: input.geofenceSource,
          status: AttendanceSessionStatus.SCHEDULED,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "attendance_session.created",
          targetType: "AttendanceSession",
          targetId: createdSession.id,
          metadata: {
            sectionId: section.id,
            responsibleMembershipId: responsibleMembership.id,
            responsibleUserId: responsibleMembership.userId,
            responsibleRole: responsibleMembership.role,
          },
        },
      });

      return createdSession;
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

export async function startAdminAttendanceSession(
  authContext: AdminAuthContext,
  sessionId: string,
): Promise<StartAdminAttendanceSessionResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    return {
      ok: false,
      message: "Başlatmak için geçerli bir yoklama oturumu seçin.",
    };
  }

  try {
    const session = await db.attendanceSession.findFirst({
      where: {
        id: normalizedSessionId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!session) {
      return {
        ok: false,
        message: "Yoklama oturumu bulunamadı.",
      };
    }

    if (session.status === AttendanceSessionStatus.ACTIVE) {
      return {
        ok: true,
        sessionId: session.id,
      };
    }

    if (
      session.status !== AttendanceSessionStatus.DRAFT &&
      session.status !== AttendanceSessionStatus.SCHEDULED
    ) {
      return {
        ok: false,
        message: "Bu oturum artık başlatılamaz.",
      };
    }

    await db.$transaction([
      db.attendanceSession.update({
        where: {
          id_organizationId: {
            id: session.id,
            organizationId,
          },
        },
        data: {
          status: AttendanceSessionStatus.ACTIVE,
        },
      }),
      db.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "attendance_session.started",
          targetType: "AttendanceSession",
          targetId: session.id,
        },
      }),
    ]);

    return {
      ok: true,
      sessionId: session.id,
    };
  } catch {
    return {
      ok: false,
      message: "Oturum şu anda başlatılamadı. Lütfen tekrar deneyin.",
    };
  }
}
