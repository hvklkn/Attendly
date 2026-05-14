import "server-only";

import {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
} from "@/lib/generated/prisma/enums";
import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import { db } from "@/lib/db";

const INSTRUCTOR_ACTIVE_SESSION_STATUSES = [
  AttendanceSessionStatus.DRAFT,
  AttendanceSessionStatus.SCHEDULED,
  AttendanceSessionStatus.ACTIVE,
];

function getInstructorSessionWhere(
  authContext: InstructorAuthContext,
  sessionId?: string,
) {
  return {
    ...(sessionId ? { id: sessionId } : {}),
    organizationId: getInstructorOrganizationId(authContext),
    section: {
      is: {
        instructorMembershipId: authContext.membership.id,
      },
    },
  };
}

export async function getInstructorDashboardData(
  authContext: InstructorAuthContext,
) {
  const now = new Date();
  const where = getInstructorSessionWhere(authContext);

  const [totalSessions, upcomingSessionsCount, activeSessionsCount] =
    await Promise.all([
      db.attendanceSession.count({
        where,
      }),
      db.attendanceSession.count({
        where: {
          ...where,
          startTime: {
            gte: now,
          },
          status: {
            in: INSTRUCTOR_ACTIVE_SESSION_STATUSES,
          },
        },
      }),
      db.attendanceSession.count({
        where: {
          ...where,
          status: AttendanceSessionStatus.ACTIVE,
        },
      }),
    ]);

  return {
    totalSessions,
    upcomingSessionsCount,
    activeSessionsCount,
  };
}

export async function getInstructorSessionsData(
  authContext: InstructorAuthContext,
  input?: {
    query?: string;
  },
) {
  const query = input?.query?.trim();

  return db.attendanceSession.findMany({
    where: {
      ...getInstructorSessionWhere(authContext),
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
    select: instructorSessionListSelect,
  });
}

export async function getInstructorSessionDetailData(
  authContext: InstructorAuthContext,
  sessionId: string,
) {
  const organizationId = getInstructorOrganizationId(authContext);

  const [session, attendanceStatusCounts] = await Promise.all([
    db.attendanceSession.findFirst({
      where: getInstructorSessionWhere(authContext, sessionId),
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
            isActive: true,
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
            description: true,
            address: true,
            allowedRadiusMeters: true,
            isActive: true,
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
          take: 6,
          select: {
            id: true,
            status: true,
            checkedInAt: true,
            createdAt: true,
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
        attendanceSession: {
          section: {
            instructorMembershipId: authContext.membership.id,
          },
        },
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

  return {
    session,
    attendanceStatusCounts,
    attendedRecords,
    latestQrToken: session.qrTokens[0] ?? null,
  };
}

const instructorSessionListSelect = {
  id: true,
  title: true,
  startTime: true,
  endTime: true,
  status: true,
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
    },
  },
  qrTokens: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      attendanceRecords: true,
    },
  },
} as const;
