import "server-only";

import {
  AttendanceSessionStatus,
  EnrollmentStatus,
  MembershipRole,
  PresenceCheckType,
} from "@/lib/generated/prisma/enums";
import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import { db } from "@/lib/db";
import type { InstructorSessionCreateOptionsData } from "@/lib/instructor/session-create";

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
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const where = getInstructorSessionWhere(authContext);
  const organizationId = getInstructorOrganizationId(authContext);

  const [
    totalSessions,
    todaySessionsCount,
    upcomingSessionsCount,
    activeSessionsCount,
    totalSections,
    distinctStudents,
    sections,
    recentSessions,
    recentSecurityAlerts,
  ] = await Promise.all([
    db.attendanceSession.count({
      where,
    }),
    db.attendanceSession.count({
      where: {
        ...where,
        startTime: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
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
    db.section.count({
      where: {
        organizationId,
        instructorMembershipId: authContext.membership.id,
      },
    }),
    db.enrollment.findMany({
      where: {
        organizationId,
        status: EnrollmentStatus.ACTIVE,
        section: {
          is: {
            instructorMembershipId: authContext.membership.id,
          },
        },
      },
      distinct: ["studentMembershipId"],
      select: {
        studentMembershipId: true,
      },
    }),
    db.section.findMany({
      where: {
        organizationId,
        instructorMembershipId: authContext.membership.id,
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
      take: 6,
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
              },
            },
            attendanceSessions: true,
          },
        },
      },
    }),
    db.attendanceSession.findMany({
      where,
      orderBy: [
        {
          startTime: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 6,
      select: instructorSessionListSelect,
    }),
    db.attendanceAlert.findMany({
      where: {
        organizationId,
        attendanceSession: {
          section: {
            instructorMembershipId: authContext.membership.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        alertType: true,
        message: true,
        createdAt: true,
        attendanceSession: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                name: true,
                code: true,
                course: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
        studentUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalSessions,
    todaySessionsCount,
    upcomingSessionsCount,
    activeSessionsCount,
    totalSections,
    totalStudents: distinctStudents.length,
    sections,
    recentSessions,
    recentSecurityAlerts,
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

export async function getInstructorSessionCreateOptionsData(
  authContext: InstructorAuthContext,
): Promise<InstructorSessionCreateOptionsData> {
  const organizationId = getInstructorOrganizationId(authContext);

  const [sections, rooms] = await Promise.all([
    db.section.findMany({
      where: {
        organizationId,
        instructorMembershipId: authContext.membership.id,
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
        course: {
          select: {
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
    }),
    db.room.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [
        {
          code: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        latitude: true,
        longitude: true,
        allowedRadiusMeters: true,
      },
    }),
  ]);

  return {
    sections,
    rooms: rooms.map((room) => ({
      ...room,
      latitude: room.latitude?.toString() ?? null,
      longitude: room.longitude?.toString() ?? null,
    })),
  };
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
        geofenceLatitude: true,
        geofenceLongitude: true,
        geofenceAccuracyMeters: true,
        geofenceRadiusMeters: true,
        geofenceCapturedAt: true,
        geofenceSource: true,
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
            enrollments: {
              where: {
                status: EnrollmentStatus.ACTIVE,
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
                    locationAccuracyMeters: true,
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
                        distanceToGeofenceMeters: true,
                        checkedAt: true,
                      },
                    },
                  },
                },
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
            source: true,
            checkedInAt: true,
            createdAt: true,
            locationAccuracyMeters: true,
            locationLatitude: true,
            locationLongitude: true,
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
                distanceToGeofenceMeters: true,
                checkedAt: true,
              },
            },
            studentUser: {
              select: {
                name: true,
                email: true,
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

  return {
    session,
    attendanceStatusCounts,
    latestQrToken: session.qrTokens[0] ?? null,
  };
}

export async function getInstructorStudentsData(
  authContext: InstructorAuthContext,
  input?: {
    query?: string;
  },
) {
  const organizationId = getInstructorOrganizationId(authContext);
  const query = input?.query?.trim();

  const [students, sections] = await Promise.all([
    db.membership.findMany({
      where: {
        organizationId,
        role: MembershipRole.STUDENT,
        ...(query
          ? {
              OR: [
                {
                  user: {
                    is: {
                      name: {
                        contains: query,
                      },
                    },
                  },
                },
                {
                  user: {
                    is: {
                      email: {
                        contains: query,
                      },
                    },
                  },
                },
                {
                  enrollments: {
                    some: {
                      section: {
                        is: {
                          name: {
                            contains: query,
                          },
                        },
                      },
                    },
                  },
                },
                {
                  enrollments: {
                    some: {
                      section: {
                        is: {
                          code: {
                            contains: query,
                          },
                        },
                      },
                    },
                  },
                },
                {
                  enrollments: {
                    some: {
                      section: {
                        is: {
                          course: {
                            is: {
                              code: {
                                contains: query,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      take: 100,
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        enrollments: {
          where: {
            organizationId,
          },
          orderBy: [
            {
              status: "asc",
            },
            {
              enrolledAt: "desc",
            },
          ],
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            endedAt: true,
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
              },
            },
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
        course: {
          select: {
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
    }),
  ]);

  return {
    students,
    sections,
  };
}

export async function getInstructorStudentCreateOptionsData(
  authContext: InstructorAuthContext,
) {
  const organizationId = getInstructorOrganizationId(authContext);

  const sections = await db.section.findMany({
    where: {
      organizationId,
      instructorMembershipId: authContext.membership.id,
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
      course: {
        select: {
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

  return {
    sections,
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
  attendanceRecords: {
    select: {
      status: true,
    },
  },
} as const;
