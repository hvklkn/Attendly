"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { routes } from "@/constants/routes";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  AttendanceSource,
  AttendanceVerificationLevel,
  EnrollmentStatus,
  PresenceCheckStatus,
  PresenceCheckType,
} from "@/lib/generated/prisma/enums";
import {
  calculateDistanceMeters,
  isValidLatitude,
  isValidLongitude,
  resolveAttendanceGeofence,
} from "@/lib/geofence";
import { hashQrToken } from "@/lib/qr-tokens";
import {
  createStudentScanResultUrl,
  type StudentScanResultCode,
} from "@/lib/student/attendance-result";

export type SubmitStudentAttendanceActionInput = {
  token: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
};

export type SubmitStudentAttendanceActionResult = {
  ok: boolean;
  code: StudentScanResultCode;
  message: string;
  resultUrl: string;
};

function createActionResult(input: {
  ok: boolean;
  code: StudentScanResultCode;
  message: string;
  recordId?: string | null;
  sessionId?: string | null;
  token?: string | null;
}): SubmitStudentAttendanceActionResult {
  return {
    ok: input.ok,
    code: input.code,
    message: input.message,
    resultUrl: createStudentScanResultUrl({
      code: input.code,
      recordId: input.recordId,
      sessionId: input.sessionId,
      token: input.token,
    }),
  };
}

function normalizeAccuracyMeters(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function getAcceptedAttendanceStatus(
  startTime: Date,
  lateThresholdMinutes: number,
  now: Date,
) {
  if (lateThresholdMinutes <= 0) {
    return AttendanceRecordStatus.PRESENT;
  }

  const lateAt = startTime.getTime() + lateThresholdMinutes * 60_000;

  return now.getTime() > lateAt
    ? AttendanceRecordStatus.LATE
    : AttendanceRecordStatus.PRESENT;
}

async function getRequestMetadata() {
  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");

    return {
      userAgent: requestHeaders.get("user-agent"),
      ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    };
  } catch {
    return {
      userAgent: null,
      ipAddress: null,
    };
  }
}

export async function submitStudentAttendanceAction(
  input: SubmitStudentAttendanceActionInput,
): Promise<SubmitStudentAttendanceActionResult> {
  const authContext = await requireRole("STUDENT");
  const token = input.token.trim();
  const now = new Date();

  if (!token) {
    return createActionResult({
      ok: false,
      code: "missing_token",
      message: "QR kodu bulunamadı. Lütfen QR kodu tekrar okutun.",
    });
  }

  if (
    !isValidLatitude(input.latitude) ||
    !isValidLongitude(input.longitude)
  ) {
    return createActionResult({
      ok: false,
      code: "location_unavailable",
      message: "Konumunuz alınamadı. Lütfen konum izni verip tekrar deneyin.",
      token,
    });
  }

  try {
    const qrToken = await db.qRToken.findUnique({
      where: {
        tokenHash: hashQrToken(token),
      },
      select: {
        id: true,
        organizationId: true,
        expiresAt: true,
        revokedAt: true,
        attendanceSession: {
          select: {
            id: true,
            organizationId: true,
            sectionId: true,
            title: true,
            startTime: true,
            status: true,
            lateThresholdMinutes: true,
            geofenceLatitude: true,
            geofenceLongitude: true,
            geofenceRadiusMeters: true,
            room: {
              select: {
                latitude: true,
                longitude: true,
                allowedRadiusMeters: true,
              },
            },
          },
        },
      },
    });

    if (
      !qrToken ||
      qrToken.organizationId !== authContext.activeOrganization.id ||
      qrToken.attendanceSession.organizationId !==
        authContext.activeOrganization.id
    ) {
      return createActionResult({
        ok: false,
        code: "invalid_token",
        message:
          "Yoklama kaydı oluşturulamadı. Lütfen QR kodu tekrar okutun.",
      });
    }

    const sessionId = qrToken.attendanceSession.id;

    if (qrToken.revokedAt) {
      return createActionResult({
        ok: false,
        code: "revoked_token",
        message: "QR kod yenilenmiş. Öğretmeninizden yeni QR kod isteyin.",
        sessionId,
      });
    }

    if (qrToken.expiresAt.getTime() <= now.getTime()) {
      return createActionResult({
        ok: false,
        code: "expired_token",
        message:
          "QR kodun süresi dolmuş. Öğretmeninizden yeni QR kod isteyin.",
        sessionId,
      });
    }

    if (qrToken.attendanceSession.status === AttendanceSessionStatus.CLOSED) {
      return createActionResult({
        ok: false,
        code: "session_closed",
        message: "Bu yoklama oturumu kapanmıştır.",
        sessionId,
      });
    }

    if (qrToken.attendanceSession.status !== AttendanceSessionStatus.ACTIVE) {
      return createActionResult({
        ok: false,
        code: "session_unavailable",
        message: "Oturum aktif değil. Lütfen öğretmeninizden başlatmasını isteyin.",
        sessionId,
      });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        organizationId_sectionId_studentMembershipId: {
          organizationId: authContext.activeOrganization.id,
          sectionId: qrToken.attendanceSession.sectionId,
          studentMembershipId: authContext.membership.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      return createActionResult({
        ok: false,
        code: "session_unavailable",
        message: "Bu ders grubuna kayıtlı görünmüyorsunuz.",
        sessionId,
      });
    }

    const existingRecord = await db.attendanceRecord.findUnique({
      where: {
        organizationId_attendanceSessionId_studentMembershipId: {
          organizationId: authContext.activeOrganization.id,
          attendanceSessionId: sessionId,
          studentMembershipId: authContext.membership.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRecord) {
      return createActionResult({
        ok: true,
        code: "already_checked_in",
        message: "Bu oturuma daha önce yoklama verdiniz.",
        recordId: existingRecord.id,
        sessionId,
      });
    }

    const geofence = resolveAttendanceGeofence({
      session: qrToken.attendanceSession,
      room: qrToken.attendanceSession.room,
    });

    if (!geofence) {
      return createActionResult({
        ok: false,
        code: "session_unavailable",
        message:
          "Bu oturumun konum sınırı hazır değil. Lütfen öğretmeninizden kontrol etmesini isteyin.",
        sessionId,
      });
    }

    const distanceMeters = calculateDistanceMeters(
      {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
      },
      {
        latitude: input.latitude,
        longitude: input.longitude,
      },
    );
    const roundedDistanceMeters = Math.round(distanceMeters * 100) / 100;
    const isInsideGeofence = distanceMeters <= geofence.radiusMeters;
    const requestMetadata = await getRequestMetadata();
    const locationAccuracyMeters = normalizeAccuracyMeters(input.accuracyMeters);
    const status = isInsideGeofence
      ? getAcceptedAttendanceStatus(
          qrToken.attendanceSession.startTime,
          qrToken.attendanceSession.lateThresholdMinutes,
          now,
        )
      : AttendanceRecordStatus.REJECTED;
    const rejectionReason = isInsideGeofence
      ? null
      : "Konum dışındasınız. Yoklama kaydı reddedildi.";

    const transactionResult = await db.$transaction(async (tx) => {
      const recordCreatedDuringRace = await tx.attendanceRecord.findUnique({
        where: {
          organizationId_attendanceSessionId_studentMembershipId: {
            organizationId: authContext.activeOrganization.id,
            attendanceSessionId: sessionId,
            studentMembershipId: authContext.membership.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (recordCreatedDuringRace) {
        return {
          duplicateRecordId: recordCreatedDuringRace.id,
          recordId: null,
        };
      }

      const record = await tx.attendanceRecord.create({
        data: {
          organizationId: authContext.activeOrganization.id,
          attendanceSessionId: sessionId,
          studentMembershipId: authContext.membership.id,
          studentUserId: authContext.user.id,
          enrollmentId: enrollment.id,
          status,
          source: AttendanceSource.QR_SCAN,
          verificationLevel: isInsideGeofence
            ? AttendanceVerificationLevel.INITIAL_ONLY
            : AttendanceVerificationLevel.SUSPICIOUS,
          lastVerifiedAt: isInsideGeofence ? now : null,
          suspiciousFlag: !isInsideGeofence,
          checkedInAt: now,
          locationLatitude: input.latitude,
          locationLongitude: input.longitude,
          locationAccuracyMeters,
          distanceMeters: roundedDistanceMeters,
          rejectionReason,
          deviceUserAgent: requestMetadata.userAgent,
          ipAddress: requestMetadata.ipAddress,
        },
        select: {
          id: true,
        },
      });

      await tx.presenceCheck.create({
        data: {
          organizationId: authContext.activeOrganization.id,
          attendanceSessionId: sessionId,
          attendanceRecordId: record.id,
          studentUserId: authContext.user.id,
          studentMembershipId: authContext.membership.id,
          checkType: PresenceCheckType.INITIAL_CHECK_IN,
          status: isInsideGeofence
            ? PresenceCheckStatus.INSIDE_GEOFENCE
            : PresenceCheckStatus.OUTSIDE_GEOFENCE,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: locationAccuracyMeters,
          distanceToGeofenceMeters: roundedDistanceMeters,
          checkedAt: now,
          metadata: {
            qrTokenId: qrToken.id,
            geofenceRadiusMeters: geofence.radiusMeters,
            geofenceSource: geofence.source,
          },
        },
      });

      return {
        duplicateRecordId: null,
        recordId: record.id,
      };
    });

    revalidatePath(routes.student.attendance);
    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath(`/instructor/sessions/${sessionId}`);
    revalidatePath(routes.admin.sessions);
    revalidatePath(routes.instructor.sessions);

    if (transactionResult.duplicateRecordId) {
      return createActionResult({
        ok: true,
        code: "already_checked_in",
        message: "Bu oturuma daha önce yoklama verdiniz.",
        recordId: transactionResult.duplicateRecordId,
        sessionId,
      });
    }

    if (!transactionResult.recordId) {
      return createActionResult({
        ok: false,
        code: "error",
        message:
          "Yoklama kaydı oluşturulamadı. Lütfen QR kodu tekrar okutun.",
        sessionId,
      });
    }

    if (!isInsideGeofence) {
      return createActionResult({
        ok: false,
        code: "outside_geofence",
        message: "Konum dışındasınız. Yoklama kaydı reddedildi.",
        recordId: transactionResult.recordId,
        sessionId,
      });
    }

    return createActionResult({
      ok: true,
      code:
        status === AttendanceRecordStatus.LATE ? "late_success" : "success",
      message:
        status === AttendanceRecordStatus.LATE
          ? "Yoklamanız geç olarak kaydedildi."
          : "Yoklama başarıyla kaydedildi.",
      recordId: transactionResult.recordId,
      sessionId,
    });
  } catch (error) {
    console.error("Student attendance check-in failed", error);

    return createActionResult({
      ok: false,
      code: "error",
      message: "Yoklama kaydı oluşturulamadı. Lütfen QR kodu tekrar okutun.",
    });
  }
}
