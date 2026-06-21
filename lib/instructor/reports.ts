import "server-only";

import { routes } from "@/constants/routes";
import { db } from "@/lib/db";
import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  EnrollmentStatus,
} from "@/lib/generated/prisma/enums";
import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import { getInstructorAssignedSectionWhere } from "@/lib/instructor/assignment-scope";
import {
  formatDateTimeTr,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";

export type InstructorReportStatusFilter = "all" | "ACTIVE" | "CLOSED";

export type InstructorReportsFilters = {
  courseId: string;
  sectionId: string;
  from: string;
  to: string;
  status: InstructorReportStatusFilter;
  student: string;
};

export type InstructorReportsOptions = {
  courses: Array<{
    id: string;
    code: string;
    title: string;
  }>;
  sections: Array<{
    id: string;
    name: string;
    code: string | null;
    courseId: string;
    course: {
      code: string;
      title: string;
    };
    activeStudentCount: number;
  }>;
};

export type InstructorSectionReportStudentRow = {
  studentName: string;
  email: string;
  sectionLabel: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  rejectedCount: number;
  attendanceRate: string;
  lastAttendanceAt: string;
};

export type InstructorSectionReportSessionRow = {
  id: string;
  courseSection: string;
  title: string;
  startTime: string;
  endTime: string;
  statusLabel: string;
  status: string;
  acceptedCount: number;
  totalStudents: number;
  attendanceRate: string;
  detailHref: string;
};

export type InstructorSectionReportData = {
  sectionLabel: string;
  courseTitle: string;
  summary: {
    totalSessions: number;
    totalActiveStudents: number;
    averageAttendanceRate: string;
    totalAttendance: number;
    totalLateAttendance: number;
    totalAbsence: number;
    totalRejected: number;
    totalSecurityAlerts: number;
  };
  studentRows: InstructorSectionReportStudentRow[];
  sessionRows: InstructorSectionReportSessionRow[];
};

type DateRange = {
  from?: Date;
  to?: Date;
};

function parseDateOnly(value: string, boundary: "start" | "end") {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return null;
  }

  const date = new Date(`${trimmedValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function getDateRange(filters: InstructorReportsFilters): DateRange {
  const from = parseDateOnly(filters.from, "start");
  const to = parseDateOnly(filters.to, "end");

  return {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function formatPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatSectionLabel(section: {
  name: string;
  code: string | null;
  course: {
    code: string;
  };
}) {
  return section.code
    ? `${section.course.code} - ${section.code}`
    : `${section.course.code} - ${section.name}`;
}

function isAcceptedStatus(status: string) {
  return (
    status === AttendanceRecordStatus.PRESENT ||
    status === AttendanceRecordStatus.LATE
  );
}

export async function getInstructorReportsOptions(
  authContext: InstructorAuthContext,
): Promise<InstructorReportsOptions> {
  const organizationId = getInstructorOrganizationId(authContext);
  const sections = await db.section.findMany({
    where: getInstructorAssignedSectionWhere(authContext, {
      activeSectionOnly: true,
      activeCourseOnly: true,
    }),
    orderBy: [
      {
        courseId: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      code: true,
      courseId: true,
      course: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
      _count: {
        select: {
          enrollments: {
            where: {
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
    },
  });
  const courseMap = new Map<
    string,
    {
      id: string;
      code: string;
      title: string;
    }
  >();

  for (const section of sections) {
    courseMap.set(section.course.id, section.course);
  }

  return {
    courses: Array.from(courseMap.values()).sort((left, right) =>
      left.code.localeCompare(right.code, "tr"),
    ),
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
      code: section.code,
      courseId: section.courseId,
      course: {
        code: section.course.code,
        title: section.course.title,
      },
      activeStudentCount: section._count.enrollments,
    })),
  };
}

export async function getInstructorSectionReportData(
  authContext: InstructorAuthContext,
  filters: InstructorReportsFilters,
): Promise<InstructorSectionReportData | null> {
  const organizationId = getInstructorOrganizationId(authContext);
  const sectionId = filters.sectionId.trim();
  const courseId = filters.courseId.trim();

  if (!sectionId) {
    return null;
  }

  const studentQuery = filters.student.trim();
  const section = await db.section.findFirst({
    where: {
      id: sectionId,
      ...getInstructorAssignedSectionWhere(authContext),
      ...(courseId ? { courseId } : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      course: {
        select: {
          code: true,
          title: true,
        },
      },
      enrollments: {
        where: {
          organizationId,
          status: EnrollmentStatus.ACTIVE,
          ...(studentQuery
            ? {
                studentMembership: {
                  is: {
                    user: {
                      is: {
                        OR: [
                          {
                            name: {
                              contains: studentQuery,
                            },
                          },
                          {
                            email: {
                              contains: studentQuery,
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              }
            : {}),
        },
        orderBy: {
          enrolledAt: "asc",
        },
        select: {
          id: true,
          studentMembershipId: true,
          studentMembership: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!section) {
    return null;
  }

  const dateRange = getDateRange(filters);
  const studentMembershipIds = section.enrollments.map(
    (enrollment) => enrollment.studentMembershipId,
  );
  const sessions = await db.attendanceSession.findMany({
    where: {
      organizationId,
      sectionId: section.id,
      ...(filters.status === "all" ? {} : { status: filters.status }),
      ...(dateRange.from || dateRange.to
        ? {
            startTime: {
              ...(dateRange.from ? { gte: dateRange.from } : {}),
              ...(dateRange.to ? { lte: dateRange.to } : {}),
            },
          }
        : {}),
    },
    orderBy: [
      {
        startTime: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
      attendanceRecords: {
        where: {
          organizationId,
          studentMembershipId: {
            in: studentMembershipIds,
          },
        },
        select: {
          id: true,
          studentMembershipId: true,
          status: true,
          checkedInAt: true,
          createdAt: true,
        },
      },
    },
  });
  const sessionIds = sessions.map((session) => session.id);
  const totalSecurityAlerts =
    sessionIds.length > 0
      ? await db.attendanceAlert.count({
          where: {
            organizationId,
            attendanceSessionId: {
              in: sessionIds,
            },
            ...(studentMembershipIds.length > 0
              ? {
                  OR: [
                    {
                      studentMembershipId: {
                        in: studentMembershipIds,
                      },
                    },
                    {
                      studentMembershipId: null,
                    },
                  ],
                }
              : {}),
          },
        })
      : 0;

  const totalSessions = sessions.length;
  const sectionLabel = formatSectionLabel(section);
  let totalPresent = 0;
  let totalLate = 0;
  let totalAbsent = 0;
  let totalRejected = 0;

  const studentRows: InstructorSectionReportStudentRow[] = section.enrollments
    .map((enrollment) => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let rejectedCount = 0;
      let lastAttendanceAt: Date | null = null;

      for (const session of sessions) {
        const record = session.attendanceRecords.find(
          (item) => item.studentMembershipId === enrollment.studentMembershipId,
        );

        if (!record) {
          absentCount += 1;
          continue;
        }

        if (record.status === AttendanceRecordStatus.PRESENT) {
          presentCount += 1;
        } else if (record.status === AttendanceRecordStatus.LATE) {
          lateCount += 1;
        } else if (record.status === AttendanceRecordStatus.REJECTED) {
          rejectedCount += 1;
        }

        if (isAcceptedStatus(record.status)) {
          const checkedAt = record.checkedInAt ?? record.createdAt;

          if (!lastAttendanceAt || checkedAt > lastAttendanceAt) {
            lastAttendanceAt = checkedAt;
          }
        }
      }

      totalPresent += presentCount;
      totalLate += lateCount;
      totalAbsent += absentCount;
      totalRejected += rejectedCount;

      return {
        studentName:
          enrollment.studentMembership.user.name ?? "İsimsiz öğrenci",
        email: enrollment.studentMembership.user.email,
        sectionLabel,
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        rejectedCount,
        attendanceRate: formatPercentage(
          presentCount + lateCount,
          totalSessions,
        ),
        lastAttendanceAt: lastAttendanceAt
          ? formatDateTimeTr(lastAttendanceAt)
          : "Henüz katılım yok",
      };
    })
    .sort((left, right) =>
      left.studentName.localeCompare(right.studentName, "tr"),
    );

  const possibleAttendances = totalSessions * section.enrollments.length;
  const totalAccepted = totalPresent + totalLate;
  const sessionRows: InstructorSectionReportSessionRow[] = sessions.map(
    (session) => {
      const acceptedCount = session.attendanceRecords.filter((record) =>
        isAcceptedStatus(record.status),
      ).length;
      const totalStudents = section.enrollments.length;

      return {
        id: session.id,
        courseSection: sectionLabel,
        title: session.title,
        startTime: formatDateTimeTr(session.startTime),
        endTime: formatDateTimeTr(session.endTime),
        status: session.status,
        statusLabel: getAttendanceSessionStatusLabel(session.status),
        acceptedCount,
        totalStudents,
        attendanceRate: formatPercentage(acceptedCount, totalStudents),
        detailHref: `${routes.instructor.sessions}/${session.id}`,
      };
    },
  );

  return {
    sectionLabel,
    courseTitle: section.course.title,
    summary: {
      totalSessions,
      totalActiveStudents: section.enrollments.length,
      averageAttendanceRate: formatPercentage(
        totalAccepted,
        possibleAttendances,
      ),
      totalAttendance: totalAccepted,
      totalLateAttendance: totalLate,
      totalAbsence: totalAbsent,
      totalRejected,
      totalSecurityAlerts,
    },
    studentRows,
    sessionRows,
  };
}

export function normalizeInstructorReportsFilters(input: {
  courseId?: string | string[];
  sectionId?: string | string[];
  from?: string | string[];
  to?: string | string[];
  status?: string | string[];
  student?: string | string[];
}): InstructorReportsFilters {
  function getValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  }

  const status = getValue(input.status);

  return {
    courseId: getValue(input.courseId).trim(),
    sectionId: getValue(input.sectionId).trim(),
    from: getValue(input.from).trim(),
    to: getValue(input.to).trim(),
    status:
      status === AttendanceSessionStatus.ACTIVE ||
      status === AttendanceSessionStatus.CLOSED
        ? status
        : "all",
    student: getValue(input.student).trim(),
  };
}
