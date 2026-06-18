import "server-only";

import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import {
  AttendanceSessionGeofenceSource,
  AttendanceSessionStatus,
} from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  issueAttendanceSessionQrToken,
  type IssueAttendanceSessionQrTokenResult,
} from "@/lib/qr-issuance";
import type {
  InstructorCreateSessionFormErrors,
  ValidInstructorCreateSessionInput,
} from "@/lib/instructor/session-create";

export type IssueInstructorSessionQrTokenResult =
  IssueAttendanceSessionQrTokenResult;

export type StartInstructorAttendanceSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type CloseInstructorAttendanceSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export type CreateInstructorSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: InstructorCreateSessionFormErrors;
    };

function toNumber(value: { toString: () => string } | number | null) {
  if (value === null) {
    return null;
  }

  const numberValue =
    typeof value === "number" ? value : Number(value.toString());

  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasValidCoordinates(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export async function issueInstructorSessionQrToken(
  authContext: InstructorAuthContext,
  sessionId: string,
): Promise<IssueInstructorSessionQrTokenResult> {
  return issueAttendanceSessionQrToken(authContext, {
    sessionId,
    organizationId: getInstructorOrganizationId(authContext),
    instructorMembershipId: authContext.membership.id,
  });
}

export async function createInstructorAttendanceSession(
  authContext: InstructorAuthContext,
  input: ValidInstructorCreateSessionInput,
): Promise<CreateInstructorSessionResult> {
  const organizationId = getInstructorOrganizationId(authContext);

  try {
    const section = await db.section.findFirst({
      where: {
        id: input.sectionId,
        organizationId,
        instructorMembershipId: authContext.membership.id,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!section) {
      return {
        ok: false,
        message: "Bu ders grubu size atanmış değil.",
        errors: {
          sectionId:
            "Yalnızca size atanmış ders grupları için oturum oluşturabilirsiniz.",
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

    const room = input.roomId
      ? await db.room.findFirst({
          where: {
            id: input.roomId,
            organizationId,
            isActive: true,
          },
          select: {
            id: true,
            latitude: true,
            longitude: true,
          },
        })
      : null;

    if (input.roomId && !room) {
      return {
        ok: false,
        message: "Bu kurumdan aktif bir oda seçin.",
        errors: {
          roomId: "Bu kurumdan aktif bir oda seçin.",
        },
      };
    }

    const deviceLatitude = input.geofenceLatitude;
    const deviceLongitude = input.geofenceLongitude;
    const hasDeviceGeofence = hasValidCoordinates(
      deviceLatitude,
      deviceLongitude,
    );
    const roomLatitude = toNumber(room?.latitude ?? null);
    const roomLongitude = toNumber(room?.longitude ?? null);
    const hasRoomGeofence = hasValidCoordinates(roomLatitude, roomLongitude);

    if (!hasDeviceGeofence && !hasRoomGeofence) {
      return {
        ok: false,
        message:
          "Oturum için konum gerekli. Mevcut konumunuzu alın veya koordinatı olan bir oda seçin.",
        errors: {
          geofenceLatitude:
            "Mevcut konumunuzu alın veya koordinatı olan bir oda seçin.",
          roomId: "Koordinatı olan bir oda seçin.",
        },
      };
    }

    const geofenceLatitude = hasDeviceGeofence
      ? deviceLatitude
      : roomLatitude;
    const geofenceLongitude = hasDeviceGeofence
      ? deviceLongitude
      : roomLongitude;
    const geofenceAccuracyMeters = hasDeviceGeofence
      ? input.geofenceAccuracyMeters
      : null;
    const geofenceSource = hasDeviceGeofence
      ? AttendanceSessionGeofenceSource.DEVICE
      : AttendanceSessionGeofenceSource.ROOM;

    const session = await db.$transaction(async (tx) => {
      const createdSession = await tx.attendanceSession.create({
        data: {
          organizationId,
          sectionId: section.id,
          roomId: room?.id ?? null,
          createdByMembershipId: authContext.membership.id,
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          status: AttendanceSessionStatus.ACTIVE,
          lateThresholdMinutes: 0,
          geofenceLatitude,
          geofenceLongitude,
          geofenceAccuracyMeters,
          geofenceRadiusMeters: input.geofenceRadiusMeters,
          geofenceCapturedAt: new Date(),
          geofenceSource,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "attendance_session.created_by_instructor",
          targetType: "AttendanceSession",
          targetId: createdSession.id,
          metadata: {
            sectionId: section.id,
            roomId: room?.id ?? null,
            geofenceSource,
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
        "Yoklama oturumu şu anda oluşturulamadı. Lütfen formu kontrol edip tekrar deneyin.",
    };
  }
}

export async function startInstructorAttendanceSession(
  authContext: InstructorAuthContext,
  sessionId: string,
): Promise<StartInstructorAttendanceSessionResult> {
  const organizationId = getInstructorOrganizationId(authContext);
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
        section: {
          is: {
            instructorMembershipId: authContext.membership.id,
          },
        },
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

    await db.attendanceSession.update({
      where: {
        id_organizationId: {
          id: session.id,
          organizationId,
        },
      },
      data: {
        status: AttendanceSessionStatus.ACTIVE,
      },
    });

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

export async function closeInstructorAttendanceSession(
  authContext: InstructorAuthContext,
  sessionId: string,
): Promise<CloseInstructorAttendanceSessionResult> {
  const organizationId = getInstructorOrganizationId(authContext);
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    return {
      ok: false,
      message: "Kapatmak için geçerli bir yoklama oturumu seçin.",
    };
  }

  try {
    const session = await db.attendanceSession.findFirst({
      where: {
        id: normalizedSessionId,
        organizationId,
        section: {
          is: {
            instructorMembershipId: authContext.membership.id,
          },
        },
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

    if (session.status === AttendanceSessionStatus.CLOSED) {
      return {
        ok: true,
        sessionId: session.id,
      };
    }

    if (session.status !== AttendanceSessionStatus.ACTIVE) {
      return {
        ok: false,
        message: "Yalnızca aktif yoklama oturumları kapatılabilir.",
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
          status: AttendanceSessionStatus.CLOSED,
        },
      }),
      db.qRToken.updateMany({
        where: {
          organizationId,
          attendanceSessionId: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      db.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "attendance_session.closed_by_instructor",
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
      message: "Oturum şu anda kapatılamadı. Lütfen tekrar deneyin.",
    };
  }
}
