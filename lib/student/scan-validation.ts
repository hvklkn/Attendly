import "server-only";

import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import { hashQrToken } from "@/lib/qr-tokens";
import type { AuthContext } from "@/types/auth";

export type StudentScanValidationStatus =
  | "missing_token"
  | "invalid_token"
  | "revoked_token"
  | "expired_token"
  | "session_closed"
  | "session_not_active"
  | "session_unavailable"
  | "valid";

export type StudentScanSessionDetails = {
  title: string;
  startTime: Date;
  endTime: Date;
  status: AttendanceSessionStatus;
  geofenceLatitude: { toString: () => string } | null;
  geofenceLongitude: { toString: () => string } | null;
  geofenceRadiusMeters: number | null;
  section: {
    name: string;
    code: string | null;
    course: {
      code: string;
      title: string;
    };
  };
  room: {
    name: string;
    code: string | null;
    address: string | null;
    latitude: { toString: () => string } | null;
    longitude: { toString: () => string } | null;
    allowedRadiusMeters: number | null;
  } | null;
};

export type StudentScanValidationResult =
  | {
      status: Exclude<StudentScanValidationStatus, "valid">;
    }
  | {
      status: "valid";
      tokenExpiresAt: Date;
      session: StudentScanSessionDetails;
      student: {
        name: string | null;
        email: string;
      };
      organization: {
        name: string;
      };
    };

const STUDENT_SCANNABLE_SESSION_STATUSES = [
  AttendanceSessionStatus.ACTIVE,
] as const;

function canScanSessionStatus(status: AttendanceSessionStatus) {
  return STUDENT_SCANNABLE_SESSION_STATUSES.some(
    (scannableStatus) => scannableStatus === status,
  );
}

export async function validateStudentScanToken(
  authContext: AuthContext,
  rawToken: string | null | undefined,
  now = new Date(),
): Promise<StudentScanValidationResult> {
  const normalizedToken = rawToken?.trim();

  if (!normalizedToken) {
    return {
      status: "missing_token",
    };
  }

  try {
    const qrToken = await db.qRToken.findUnique({
      where: {
        tokenHash: hashQrToken(normalizedToken),
      },
      select: {
        organizationId: true,
        expiresAt: true,
        revokedAt: true,
        attendanceSession: {
          select: {
            organizationId: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            geofenceLatitude: true,
            geofenceLongitude: true,
            geofenceRadiusMeters: true,
            section: {
              select: {
                name: true,
                code: true,
                course: {
                  select: {
                    code: true,
                    title: true,
                  },
                },
              },
            },
            room: {
              select: {
                name: true,
                code: true,
                address: true,
                latitude: true,
                longitude: true,
                allowedRadiusMeters: true,
              },
            },
          },
        },
      },
    });

    if (!qrToken) {
      return {
        status: "invalid_token",
      };
    }

    if (
      qrToken.organizationId !== authContext.activeOrganization.id ||
      qrToken.attendanceSession.organizationId !==
        authContext.activeOrganization.id
    ) {
      return {
        status: "invalid_token",
      };
    }

    if (qrToken.attendanceSession.status === AttendanceSessionStatus.CLOSED) {
      return {
        status: "session_closed",
      };
    }

    if (qrToken.revokedAt) {
      return {
        status: "revoked_token",
      };
    }

    if (qrToken.expiresAt.getTime() <= now.getTime()) {
      return {
        status: "expired_token",
      };
    }

    if (!canScanSessionStatus(qrToken.attendanceSession.status)) {
      return {
        status: "session_not_active",
      };
    }

    return {
      status: "valid",
      tokenExpiresAt: qrToken.expiresAt,
      session: {
        title: qrToken.attendanceSession.title,
        startTime: qrToken.attendanceSession.startTime,
        endTime: qrToken.attendanceSession.endTime,
        status: qrToken.attendanceSession.status,
        geofenceLatitude: qrToken.attendanceSession.geofenceLatitude,
        geofenceLongitude: qrToken.attendanceSession.geofenceLongitude,
        geofenceRadiusMeters: qrToken.attendanceSession.geofenceRadiusMeters,
        section: qrToken.attendanceSession.section,
        room: qrToken.attendanceSession.room,
      },
      student: {
        name: authContext.user.name,
        email: authContext.user.email,
      },
      organization: {
        name: authContext.activeOrganization.name,
      },
    };
  } catch {
    return {
      status: "session_unavailable",
    };
  }
}
