import "server-only";

import { db } from "@/lib/db";
import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  EnrollmentStatus,
  MembershipRole,
  PresenceCheckType,
} from "@/lib/generated/prisma/enums";
import {
  formatDateTimeTr,
  getAttendanceAlertTypeLabel,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionStatusLabel,
  getPresenceCheckStatusLabel,
} from "@/lib/localization";
import type { AuthContext } from "@/types/auth";
import type { StatusTone } from "@/types/status";

export type InstructorSessionLiveSummaryStat = {
  key:
    | "total_registered"
    | "present"
    | "late"
    | "rejected"
    | "absent"
    | "attendance_rate";
  label: string;
  value: string;
  trend: string;
  description: string;
  tone: StatusTone;
};

export type InstructorSessionLiveStatusCount = {
  status: string;
  label: string;
  count: number;
  tone: StatusTone;
};

export type InstructorSessionLiveReportRow = {
  enrollmentId: string;
  studentName: string;
  email: string;
  courseSection: string;
  statusLabel: string;
  statusTone: StatusTone;
  checkedInAt: string;
  distance: string;
  locationVerification: string;
  locationVerificationTone: StatusTone;
  securityReason: string;
  rejectionReason: string | null;
  recordStatus: string | null;
};

export type InstructorSessionLiveAlert = {
  id: string;
  studentName: string;
  email: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export type InstructorSessionLiveData = {
  sessionId: string;
  sessionStatus: string;
  sessionStatusLabel: string;
  shouldPoll: boolean;
  stoppedReason: "active" | "closed" | "expired" | "inactive";
  generatedAt: string;
  generatedAtLabel: string;
  csvFileName: string;
  summaryStats: InstructorSessionLiveSummaryStat[];
  attendanceStatusCounts: InstructorSessionLiveStatusCount[];
  reportRows: InstructorSessionLiveReportRow[];
  securityAlerts: InstructorSessionLiveAlert[];
};

type LiveAuthScope = {
  organizationId: string;
  role: string;
  membershipId: string;
};

function formatDecimalMeters(
  value: { toString: () => string } | number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "Belirtilmedi";
  }

  return `${Number(value.toString()).toFixed(0)} metre`;
}

function formatTimeTr(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function formatPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function createReportFileName(sessionTitle: string) {
  const normalizedTitle = sessionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedTitle || "yoklama"}-raporu.csv`;
}

function getAttendanceTone(status: string | null): StatusTone {
  if (
    status === AttendanceRecordStatus.PRESENT ||
    status === AttendanceRecordStatus.LATE ||
    status === AttendanceRecordStatus.MANUAL
  ) {
    return "success";
  }

  if (
    status === AttendanceRecordStatus.ABSENT ||
    status === AttendanceRecordStatus.REJECTED
  ) {
    return "danger";
  }

  return "neutral";
}

function getPresenceCheckTone(status: string | null | undefined): StatusTone {
  if (status === "INSIDE_GEOFENCE" || status === "VERIFIED") {
    return "success";
  }

  if (status === "OUTSIDE_GEOFENCE" || status === "SUSPICIOUS") {
    return "danger";
  }

  if (
    status === "LOCATION_UNAVAILABLE" ||
    status === "QR_NOT_CONFIRMED" ||
    status === "LOW_ACCURACY"
  ) {
    return "warning";
  }

  return "neutral";
}

function getLocationVerificationLabel(
  status: string | null | undefined,
  recordStatus: string,
) {
  if (status) {
    return getPresenceCheckStatusLabel(status);
  }

  return recordStatus === AttendanceRecordStatus.REJECTED
    ? "Konum dışı"
    : "Konum içi";
}

function getLocationVerificationTone(
  status: string | null | undefined,
  recordStatus: string,
) {
  if (status) {
    return getPresenceCheckTone(status);
  }

  return recordStatus === AttendanceRecordStatus.REJECTED
    ? "danger"
    : "success";
}

function getStoppedReason(session: { status: string; endTime: Date }) {
  if (session.status === AttendanceSessionStatus.CLOSED) {
    return "closed";
  }

  if (
    session.status === AttendanceSessionStatus.ACTIVE &&
    session.endTime.getTime() <= Date.now()
  ) {
    return "expired";
  }

  if (session.status !== AttendanceSessionStatus.ACTIVE) {
    return "inactive";
  }

  return "active";
}

function canReadLiveSession(
  authScope: LiveAuthScope,
  session: {
    organizationId: string;
    section: {
      instructorAssignments: Array<{
        instructorMembershipId: string;
        isActive: boolean;
      }>;
    };
  },
) {
  if (session.organizationId !== authScope.organizationId) {
    return false;
  }

  if (
    authScope.role === MembershipRole.ORG_ADMIN ||
    authScope.role === MembershipRole.SUPER_ADMIN
  ) {
    return true;
  }

  return (
    authScope.role === MembershipRole.INSTRUCTOR &&
    session.section.instructorAssignments.some(
      (assignment) =>
        assignment.isActive &&
        assignment.instructorMembershipId === authScope.membershipId,
    )
  );
}

export function canAccessInstructorLiveSession(authContext: AuthContext) {
  return (
    authContext.role === MembershipRole.INSTRUCTOR ||
    authContext.role === MembershipRole.ORG_ADMIN ||
    authContext.role === MembershipRole.SUPER_ADMIN
  );
}

export async function getInstructorSessionLiveData(
  authContext: AuthContext,
  sessionId: string,
): Promise<InstructorSessionLiveData | null> {
  if (!canAccessInstructorLiveSession(authContext)) {
    return null;
  }

  const organizationId = authContext.activeOrganization.id;
  const [session, attendanceStatusCounts] = await Promise.all([
    db.attendanceSession.findFirst({
      where: {
        id: sessionId,
        organizationId,
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        endTime: true,
        status: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            instructorAssignments: {
              where: {
                organizationId,
                isActive: true,
              },
              select: {
                instructorMembershipId: true,
                isActive: true,
              },
            },
            course: {
              select: {
                code: true,
                title: true,
              },
            },
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
              select: {
                id: true,
                studentMembership: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                        id: true,
                      },
                    },
                  },
                },
                attendanceRecords: {
                  where: {
                    attendanceSessionId: sessionId,
                    organizationId,
                  },
                  orderBy: [
                    {
                      checkedInAt: "desc",
                    },
                    {
                      createdAt: "desc",
                    },
                  ],
                  take: 1,
                  select: {
                    id: true,
                    status: true,
                    checkedInAt: true,
                    createdAt: true,
                    distanceMeters: true,
                    rejectionReason: true,
                    presenceChecks: {
                      where: {
                        checkType: PresenceCheckType.INITIAL_CHECK_IN,
                      },
                      orderBy: {
                        checkedAt: "desc",
                      },
                      take: 1,
                      select: {
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        attendanceAlerts: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            alertType: true,
            message: true,
            createdAt: true,
            studentUser: {
              select: {
                name: true,
                email: true,
                id: true,
              },
            },
          },
        },
      },
    }),
    db.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        attendanceSessionId: sessionId,
        organizationId,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  if (!session) {
    return null;
  }

  if (
    !canReadLiveSession(
      {
        organizationId,
        role: authContext.role,
        membershipId: authContext.membership.id,
      },
      session,
    )
  ) {
    return null;
  }

  const generatedAt = new Date();
  const stoppedReason = getStoppedReason(session);
  const courseAndSection = session.section.code
    ? `${session.section.course.code} - ${session.section.code} - ${session.section.name}`
    : `${session.section.course.code} - ${session.section.name}`;
  const activeEnrollments = [...session.section.enrollments].sort(
    (left, right) =>
      (
        left.studentMembership.user.name ?? left.studentMembership.user.email
      ).localeCompare(
        right.studentMembership.user.name ??
          right.studentMembership.user.email,
        "tr",
      ),
  );
  const latestAlertByStudentUserId = new Map<
    string,
    {
      alertType: string;
      message: string;
    }
  >();

  for (const alert of session.attendanceAlerts) {
    if (alert.studentUser?.id && !latestAlertByStudentUserId.has(alert.studentUser.id)) {
      latestAlertByStudentUserId.set(alert.studentUser.id, {
        alertType: alert.alertType,
        message: alert.message,
      });
    }
  }

  const reportRows = activeEnrollments.map((enrollment) => {
    const record = enrollment.attendanceRecords[0] ?? null;
    const latestPresenceCheck = record?.presenceChecks[0] ?? null;
    const studentName =
      enrollment.studentMembership.user.name ?? "İsimsiz öğrenci";
    const latestSecurityAlert = latestAlertByStudentUserId.get(
      enrollment.studentMembership.user.id,
    );
    const statusLabel = record
      ? getAttendanceRecordStatusLabel(record.status)
      : "Katılmadı";
    const checkedInAt = record?.checkedInAt
      ? formatDateTimeTr(record.checkedInAt)
      : "Henüz giriş yok";
    const distance = record
      ? formatDecimalMeters(record.distanceMeters)
      : "Belirtilmedi";
    const locationVerification = record
      ? getLocationVerificationLabel(latestPresenceCheck?.status, record.status)
      : "Yoklama kaydı yok";

    return {
      enrollmentId: enrollment.id,
      studentName,
      email: enrollment.studentMembership.user.email,
      courseSection: courseAndSection,
      statusLabel,
      statusTone: record ? getAttendanceTone(record.status) : "danger",
      checkedInAt,
      distance,
      locationVerification,
      securityReason: latestSecurityAlert
        ? `${getAttendanceAlertTypeLabel(latestSecurityAlert.alertType)} - ${latestSecurityAlert.message}`
        : record?.rejectionReason
          ? record.rejectionReason
          : "Yok",
      rejectionReason: record?.rejectionReason ?? null,
      locationVerificationTone: record
        ? getLocationVerificationTone(latestPresenceCheck?.status, record.status)
        : "neutral",
      recordStatus: record?.status ?? null,
    };
  });
  const totalRegisteredStudents = reportRows.length;
  const presentCount = reportRows.filter(
    (row) =>
      row.recordStatus === AttendanceRecordStatus.PRESENT ||
      row.recordStatus === AttendanceRecordStatus.MANUAL,
  ).length;
  const lateCount = reportRows.filter(
    (row) => row.recordStatus === AttendanceRecordStatus.LATE,
  ).length;
  const rejectedCount = reportRows.filter(
    (row) => row.recordStatus === AttendanceRecordStatus.REJECTED,
  ).length;
  const absentCount = reportRows.filter((row) => !row.recordStatus).length;
  const acceptedAttendanceCount = presentCount + lateCount;
  const attendanceRate = formatPercentage(
    acceptedAttendanceCount,
    totalRegisteredStudents,
  );

  return {
    sessionId: session.id,
    sessionStatus: session.status,
    sessionStatusLabel: getAttendanceSessionStatusLabel(session.status),
    shouldPoll: stoppedReason === "active",
    stoppedReason,
    generatedAt: generatedAt.toISOString(),
    generatedAtLabel: formatTimeTr(generatedAt),
    csvFileName: createReportFileName(session.title),
    summaryStats: [
      {
        key: "total_registered",
        label: "Toplam Kayıtlı",
        value: String(totalRegisteredStudents),
        trend: "öğrenci",
        description: "Bu şubedeki aktif kayıtlı öğrenci sayısı.",
        tone: "neutral",
      },
      {
        key: "present",
        label: "Katılan",
        value: String(presentCount),
        trend: "zamanında",
        description: "Zamanında veya manuel kabul edilen kayıtlar.",
        tone: "success",
      },
      {
        key: "late",
        label: "Geç Katılan",
        value: String(lateCount),
        trend: "geç",
        description: "Geç kalma eşiğinden sonra katılan öğrenciler.",
        tone: "warning",
      },
      {
        key: "rejected",
        label: "Reddedilen",
        value: String(rejectedCount),
        trend: "konum/kalite",
        description: "Konum veya doğruluk nedeniyle reddedilen kayıtlar.",
        tone: "danger",
      },
      {
        key: "absent",
        label: "Katılmayan",
        value: String(absentCount),
        trend: "kayıt yok",
        description: "Aktif enrollment listesinde olup kayıt oluşturmayanlar.",
        tone: "warning",
      },
      {
        key: "attendance_rate",
        label: "Katılım Oranı",
        value: attendanceRate,
        trend: `${acceptedAttendanceCount}/${totalRegisteredStudents}`,
        description: "Katılan ve geç katılanların toplam öğrenciye oranı.",
        tone: "info",
      },
    ],
    attendanceStatusCounts: attendanceStatusCounts.map((item) => ({
      status: item.status,
      label: getAttendanceRecordStatusLabel(item.status),
      count: item._count._all,
      tone: getAttendanceTone(item.status),
    })),
    reportRows,
    securityAlerts: session.attendanceAlerts.map((alert) => ({
      id: alert.id,
      studentName: alert.studentUser?.name ?? "Bilinmeyen öğrenci",
      email: alert.studentUser?.email ?? "E-posta yok",
      eventType: getAttendanceAlertTypeLabel(alert.alertType),
      message: alert.message,
      createdAt: formatDateTimeTr(alert.createdAt),
    })),
  };
}
