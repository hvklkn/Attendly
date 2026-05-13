import "server-only";

import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";

const ACTIVE_SESSION_STATUSES = [
  AttendanceSessionStatus.DRAFT,
  AttendanceSessionStatus.SCHEDULED,
  AttendanceSessionStatus.ACTIVE,
];

export async function getAdminDashboardData(authContext: AdminAuthContext) {
  const organizationId = getAdminOrganizationId(authContext);
  const now = new Date();

  const [
    totalMembers,
    totalSessions,
    upcomingSessionsCount,
    totalAttendanceRecords,
    attendedRecords,
    needsReviewCount,
    upcomingSessions,
    recentSessions,
    recentAuditLogs,
  ] = await Promise.all([
    db.membership.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
        startTime: {
          gte: now,
        },
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
      },
    }),
    db.attendanceRecord.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceRecord.count({
      where: {
        organizationId,
        status: {
          in: [
            AttendanceRecordStatus.PRESENT,
            AttendanceRecordStatus.LATE,
            AttendanceRecordStatus.MANUAL,
          ],
        },
      },
    }),
    db.attendanceRecord.count({
      where: {
        organizationId,
        status: {
          in: [
            AttendanceRecordStatus.REJECTED,
            AttendanceRecordStatus.MANUAL,
          ],
        },
      },
    }),
    db.attendanceSession.findMany({
      where: {
        organizationId,
        startTime: {
          gte: now,
        },
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 3,
      select: sessionListSelect,
    }),
    db.attendanceSession.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: sessionListSelect,
    }),
    db.auditLog.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    }),
  ]);

  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round((attendedRecords / totalAttendanceRecords) * 100)
      : null;

  return {
    totalMembers,
    totalSessions,
    upcomingSessionsCount,
    totalAttendanceRecords,
    attendedRecords,
    attendanceRate,
    needsReviewCount,
    upcomingSessions,
    recentSessions,
    recentAuditLogs,
  };
}

export async function getAdminSessionsData(
  authContext: AdminAuthContext,
  input?: {
    query?: string;
  },
) {
  const organizationId = getAdminOrganizationId(authContext);
  const query = input?.query?.trim();

  return db.attendanceSession.findMany({
    where: {
      organizationId,
      ...(query
        ? {
            OR: [
              {
                title: {
                  contains: query,
                },
              },
              {
                description: {
                  contains: query,
                },
              },
            ],
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
    take: 50,
    select: sessionListSelect,
  });
}

export async function getAdminSessionDetailData(
  authContext: AdminAuthContext,
  sessionId: string,
) {
  const organizationId = getAdminOrganizationId(authContext);

  const [session, attendanceStatusCounts] = await Promise.all([
    db.attendanceSession.findFirst({
      where: {
        id: sessionId,
        organizationId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        lateThresholdMinutes: true,
        createdAt: true,
        updatedAt: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            startsAt: true,
            endsAt: true,
            isActive: true,
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                description: true,
              },
            },
            instructorMembership: {
              select: {
                id: true,
                role: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            address: true,
            latitude: true,
            longitude: true,
            allowedRadiusMeters: true,
            isActive: true,
          },
        },
        createdByMembership: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        qrTokens: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            expiresAt: true,
            revokedAt: true,
            createdAt: true,
          },
        },
        attendanceRecords: {
          orderBy: [
            {
              checkedInAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 8,
          select: {
            id: true,
            status: true,
            source: true,
            checkedInAt: true,
            createdAt: true,
            locationAccuracyMeters: true,
            deviceUserAgent: true,
            studentUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            attendanceRecords: true,
            qrTokens: true,
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

  const attendanceCountsByStatus = attendanceStatusCounts.reduce<
    Record<string, number>
  >((accumulator, item) => {
    accumulator[item.status] = item._count._all;
    return accumulator;
  }, {});

  const attendedRecords =
    (attendanceCountsByStatus[AttendanceRecordStatus.PRESENT] ?? 0) +
    (attendanceCountsByStatus[AttendanceRecordStatus.LATE] ?? 0) +
    (attendanceCountsByStatus[AttendanceRecordStatus.MANUAL] ?? 0);

  const attendanceRate =
    session._count.attendanceRecords > 0
      ? Math.round((attendedRecords / session._count.attendanceRecords) * 100)
      : null;

  return {
    session,
    attendanceStatusCounts,
    attendedRecords,
    attendanceRate,
    latestQrToken: session.qrTokens[0] ?? null,
  };
}

export async function getAdminSessionCreateOptionsData(
  authContext: AdminAuthContext,
) {
  const organizationId = getAdminOrganizationId(authContext);

  const [courses, sections, rooms, instructors] = await Promise.all([
    db.course.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [
        {
          code: "asc",
        },
        {
          title: "asc",
        },
      ],
      select: {
        id: true,
        code: true,
        title: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    }),
    db.section.findMany({
      where: {
        organizationId,
        isActive: true,
      },
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
            code: true,
            title: true,
          },
        },
        instructorMembership: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    }),
    db.room.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        allowedRadiusMeters: true,
      },
    }),
    db.membership.findMany({
      where: {
        organizationId,
        role: MembershipRole.INSTRUCTOR,
        user: {
          is: {
            status: UserStatus.ACTIVE,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    courses,
    sections,
    rooms,
    instructors,
  };
}

export async function getAdminUsersData(
  authContext: AdminAuthContext,
  input?: {
    query?: string;
  },
) {
  const organizationId = getAdminOrganizationId(authContext);
  const query = input?.query?.trim();

  return db.membership.findMany({
    where: {
      organizationId,
      ...(query
        ? {
            user: {
              is: {
                OR: [
                  {
                    email: {
                      contains: query,
                    },
                  },
                  {
                    name: {
                      contains: query,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    },
    orderBy: [
      {
        role: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
    select: {
      id: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function getAdminReportsData(authContext: AdminAuthContext) {
  const organizationId = getAdminOrganizationId(authContext);
  const now = new Date();

  const [
    totalSessions,
    upcomingSessions,
    completedSessions,
    cancelledSessions,
    totalMembers,
    attendanceRecords,
    membershipCounts,
    attendanceStatusCounts,
  ] = await Promise.all([
    db.attendanceSession.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
        startTime: {
          gte: now,
        },
        status: {
          in: ACTIVE_SESSION_STATUSES,
        },
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
        status: AttendanceSessionStatus.CLOSED,
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
        status: AttendanceSessionStatus.CANCELLED,
      },
    }),
    db.membership.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceRecord.count({
      where: {
        organizationId,
      },
    }),
    db.membership.groupBy({
      by: ["role"],
      where: {
        organizationId,
      },
      _count: {
        _all: true,
      },
    }),
    db.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        organizationId,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  return {
    totalSessions,
    upcomingSessions,
    completedSessions,
    cancelledSessions,
    totalMembers,
    attendanceRecords,
    membershipCounts,
    attendanceStatusCounts,
  };
}

export async function getAdminSettingsData(authContext: AdminAuthContext) {
  const organizationId = getAdminOrganizationId(authContext);
  const now = new Date();

  const [memberCount, sessionCount, activeDeviceSessions] = await Promise.all([
    db.membership.count({
      where: {
        organizationId,
      },
    }),
    db.attendanceSession.count({
      where: {
        organizationId,
      },
    }),
    db.deviceSession.count({
      where: {
        organizationId,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
    }),
  ]);

  return {
    organization: authContext.activeOrganization,
    user: authContext.user,
    membership: authContext.membership,
    role: authContext.role,
    deviceSession: authContext.deviceSession,
    memberCount,
    sessionCount,
    activeDeviceSessions,
  };
}

const sessionListSelect = {
  id: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  status: true,
  createdAt: true,
  section: {
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
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  createdByMembership: {
    select: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      attendanceRecords: true,
    },
  },
} as const;
