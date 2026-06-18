"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { routes } from "@/constants/routes";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  AttendanceAlertSeverity,
  AttendanceAlertType,
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  AttendanceSource,
  AttendanceVerificationLevel,
  EnrollmentStatus,
  MembershipRole,
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

const MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS = 100;

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

function getSecurityAlertMessage(alertType: AttendanceAlertType) {
  if (alertType === AttendanceAlertType.OUTSIDE_GEOFENCE) {
    return "Öğrenci yoklama alanı dışından yoklama vermeyi denedi.";
  }

  if (alertType === AttendanceAlertType.LOW_ACCURACY_LOCATION) {
    return "Öğrencinin konum doğruluğu yoklama için yeterli değil.";
  }

  if (alertType === AttendanceAlertType.DUPLICATE_CHECK_IN_ATTEMPT) {
    return "Öğrenci aynı oturum için tekrar yoklama vermeyi denedi.";
  }

  if (alertType === AttendanceAlertType.EXPIRED_TOKEN_ATTEMPT) {
    return "Öğrenci süresi dolmuş QR kod ile yoklamaya katılmayı denedi.";
  }

  if (alertType === AttendanceAlertType.REVOKED_TOKEN_ATTEMPT) {
    return "Öğrenci iptal edilmiş QR kod ile yoklamaya katılmayı denedi.";
  }

  if (alertType === AttendanceAlertType.STUDENT_NOT_ENROLLED) {
    return "Öğrenci kayıtlı olmadığı ders grubu için yoklama vermeyi denedi.";
  }

  if (alertType === AttendanceAlertType.SESSION_CLOSED_ATTEMPT) {
    return "Öğrenci kapalı yoklama oturumuna katılmayı denedi.";
  }

  if (alertType === AttendanceAlertType.INVALID_TOKEN_ATTEMPT) {
    return "Öğrenci geçersiz QR kod ile yoklamaya katılmayı denedi.";
  }

  return "Şüpheli yoklama denemesi kaydedildi.";
}

function getSecurityAlertSeverity(alertType: AttendanceAlertType) {
  if (
    alertType === AttendanceAlertType.INVALID_TOKEN_ATTEMPT ||
    alertType === AttendanceAlertType.STUDENT_NOT_ENROLLED
  ) {
    return AttendanceAlertSeverity.HIGH;
  }

  if (
    alertType === AttendanceAlertType.OUTSIDE_GEOFENCE ||
    alertType === AttendanceAlertType.LOW_ACCURACY_LOCATION ||
    alertType === AttendanceAlertType.SESSION_CLOSED_ATTEMPT
  ) {
    return AttendanceAlertSeverity.MEDIUM;
  }

  return AttendanceAlertSeverity.LOW;
}

async function createSecurityAlert(input: {
  organizationId: string;
  attendanceSessionId: string;
  attendanceRecordId?: string | null;
  studentUserId?: string | null;
  studentMembershipId?: string | null;
  alertType: AttendanceAlertType;
  message?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  try {
    await db.attendanceAlert.create({
      data: {
        organizationId: input.organizationId,
        attendanceSessionId: input.attendanceSessionId,
        attendanceRecordId: input.attendanceRecordId ?? null,
        studentUserId: input.studentUserId ?? null,
        studentMembershipId: input.studentMembershipId ?? null,
        alertType: input.alertType,
        severity: getSecurityAlertSeverity(input.alertType),
        message: input.message ?? getSecurityAlertMessage(input.alertType),
      },
    });

    if (input.metadata) {
      await db.auditLog.create({
        data: {
          organizationId: input.organizationId,
          actorUserId: input.studentUserId ?? null,
          action: input.alertType.toLowerCase(),
          targetType: "AttendanceSession",
          targetId: input.attendanceSessionId,
          metadata: input.metadata,
        },
      });
    }
  } catch {
    // Security logging must not block the student's visible result.
  }
}

async function createInvalidTokenAuditLog(input: {
  organizationId: string;
  studentUserId: string;
  studentMembershipId: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.studentUserId,
        action: "invalid_token_attempt",
        targetType: "QRToken",
        targetId: null,
        metadata: {
          studentMembershipId: input.studentMembershipId,
        },
      },
    });
  } catch {
    // Security logging must not block the student's visible result.
  }
}

export async function submitStudentAttendanceAction(
  input: SubmitStudentAttendanceActionInput,
): Promise<SubmitStudentAttendanceActionResult> {
  const authContext = await requireRole("STUDENT");
  const token = input.token.trim();
  const now = new Date();

  if (authContext.role !== MembershipRole.STUDENT) {
    return createActionResult({
      ok: false,
      code: "student_not_enrolled",
      message: "Bu işlem için öğrenci hesabı gerekir.",
    });
  }

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
      await createInvalidTokenAuditLog({
        organizationId: authContext.activeOrganization.id,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
      });

      return createActionResult({
        ok: false,
        code: "invalid_token",
        message:
          "Yoklama kaydı oluşturulamadı. Lütfen QR kodu tekrar okutun.",
      });
    }

    const sessionId = qrToken.attendanceSession.id;

    if (qrToken.attendanceSession.status === AttendanceSessionStatus.CLOSED) {
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.SESSION_CLOSED_ATTEMPT,
        metadata: {
          qrTokenId: qrToken.id,
          tokenRevoked: Boolean(qrToken.revokedAt),
        },
      });

      return createActionResult({
        ok: false,
        code: "session_closed",
        message: "Bu yoklama oturumu kapanmıştır.",
        sessionId,
      });
    }

    if (qrToken.revokedAt) {
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.REVOKED_TOKEN_ATTEMPT,
        metadata: {
          qrTokenId: qrToken.id,
        },
      });

      return createActionResult({
        ok: false,
        code: "revoked_token",
        message: "QR kod yenilenmiş. Öğretmeninizden yeni QR kod isteyin.",
        sessionId,
      });
    }

    if (qrToken.expiresAt.getTime() <= now.getTime()) {
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.EXPIRED_TOKEN_ATTEMPT,
        metadata: {
          qrTokenId: qrToken.id,
          expiresAt: qrToken.expiresAt.toISOString(),
        },
      });

      return createActionResult({
        ok: false,
        code: "expired_token",
        message:
          "QR kodun süresi dolmuş. Öğretmeninizden yeni QR kod isteyin.",
        sessionId,
      });
    }

    if (qrToken.attendanceSession.status !== AttendanceSessionStatus.ACTIVE) {
      return createActionResult({
        ok: false,
        code: "session_not_active",
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
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.STUDENT_NOT_ENROLLED,
        metadata: {
          sectionId: qrToken.attendanceSession.sectionId,
          qrTokenId: qrToken.id,
        },
      });

      return createActionResult({
        ok: false,
        code: "student_not_enrolled",
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
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        attendanceRecordId: existingRecord.id,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.DUPLICATE_CHECK_IN_ATTEMPT,
        metadata: {
          qrTokenId: qrToken.id,
          existingRecordId: existingRecord.id,
        },
      });

      return createActionResult({
        ok: true,
        code: "already_checked_in",
        message: "Yoklamanız daha önce alınmış.",
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
    const hasLowAccuracy =
      locationAccuracyMeters === null ||
      locationAccuracyMeters > MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS;
    const isAcceptedLocation = isInsideGeofence && !hasLowAccuracy;
    const status = isAcceptedLocation
      ? getAcceptedAttendanceStatus(
          qrToken.attendanceSession.startTime,
          qrToken.attendanceSession.lateThresholdMinutes,
          now,
        )
      : AttendanceRecordStatus.REJECTED;
    const rejectionReason = isAcceptedLocation
      ? null
      : hasLowAccuracy
        ? "Konum doğruluğu düşük. Lütfen GPS’in açık olduğundan emin olup tekrar deneyin."
        : "Konum dışındasınız. Yoklama kaydı reddedildi.";
    const presenceCheckStatus = hasLowAccuracy
      ? PresenceCheckStatus.LOW_ACCURACY
      : isInsideGeofence
        ? PresenceCheckStatus.INSIDE_GEOFENCE
        : PresenceCheckStatus.OUTSIDE_GEOFENCE;
    const rejectedAlertType = hasLowAccuracy
      ? AttendanceAlertType.LOW_ACCURACY_LOCATION
      : !isInsideGeofence
        ? AttendanceAlertType.OUTSIDE_GEOFENCE
        : null;

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
          verificationLevel: isAcceptedLocation
            ? AttendanceVerificationLevel.INITIAL_ONLY
            : AttendanceVerificationLevel.SUSPICIOUS,
          lastVerifiedAt: isAcceptedLocation ? now : null,
          suspiciousFlag: !isAcceptedLocation,
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
          status: presenceCheckStatus,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: locationAccuracyMeters,
          distanceToGeofenceMeters: roundedDistanceMeters,
          checkedAt: now,
          metadata: {
            qrTokenId: qrToken.id,
            geofenceRadiusMeters: geofence.radiusMeters,
            geofenceSource: geofence.source,
            lowAccuracy: hasLowAccuracy,
          },
        },
      });

      if (rejectedAlertType) {
        await tx.attendanceAlert.create({
          data: {
            organizationId: authContext.activeOrganization.id,
            attendanceSessionId: sessionId,
            attendanceRecordId: record.id,
            studentUserId: authContext.user.id,
            studentMembershipId: authContext.membership.id,
            alertType: rejectedAlertType,
            severity: getSecurityAlertSeverity(rejectedAlertType),
            message: rejectionReason ?? getSecurityAlertMessage(rejectedAlertType),
          },
        });
      }

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
      await createSecurityAlert({
        organizationId: authContext.activeOrganization.id,
        attendanceSessionId: sessionId,
        attendanceRecordId: transactionResult.duplicateRecordId,
        studentUserId: authContext.user.id,
        studentMembershipId: authContext.membership.id,
        alertType: AttendanceAlertType.DUPLICATE_CHECK_IN_ATTEMPT,
        metadata: {
          qrTokenId: qrToken.id,
          existingRecordId: transactionResult.duplicateRecordId,
          raceDetected: true,
        },
      });

      return createActionResult({
        ok: true,
        code: "already_checked_in",
        message: "Yoklamanız daha önce alınmış.",
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

    if (hasLowAccuracy) {
      return createActionResult({
        ok: false,
        code: "low_accuracy_location",
        message:
          "Konum doğruluğu düşük. Lütfen GPS’in açık olduğundan emin olup tekrar deneyin.",
        recordId: transactionResult.recordId,
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
  } catch {
    return createActionResult({
      ok: false,
      code: "error",
      message: "Yoklama kaydı oluşturulamadı. Lütfen QR kodu tekrar okutun.",
    });
  }
}
