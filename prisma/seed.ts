import "dotenv/config";

import {
  AttendanceAlertSeverity,
  AttendanceAlertType,
  AttendanceRecordStatus,
  AttendanceSessionGeofenceSource,
  AttendanceSessionStatus,
  AttendanceSource,
  AttendanceVerificationLevel,
  EnrollmentStatus,
  MembershipRole,
  OrganizationStatus,
  PresenceCheckStatus,
  PresenceCheckType,
  UserStatus,
} from "../lib/generated/prisma/enums";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";

const organization = {
  name: "Attendly Demo University",
  slug: "demo-university",
  status: OrganizationStatus.ACTIVE,
};

const devPassword = process.env.SEED_PASSWORD ?? "AttendlyDev123!";

const seedUsers = [
  {
    email: "admin@attendly.local",
    name: "Attendly Admin",
    role: MembershipRole.ORG_ADMIN,
  },
  {
    email: "instructor@attendly.local",
    name: "Dr. Deniz Yilmaz",
    role: MembershipRole.INSTRUCTOR,
  },
  {
    email: "instructor2@attendly.local",
    name: "Dr. Ece Kaya",
    role: MembershipRole.INSTRUCTOR,
  },
  {
    email: "student@attendly.local",
    name: "Demo Student",
    role: MembershipRole.STUDENT,
  },
  {
    email: "zeynep@attendly.com",
    name: "Zeynep Demir",
    role: MembershipRole.STUDENT,
  },
  {
    email: "ali@attendly.com",
    name: "Ali Arslan",
    role: MembershipRole.STUDENT,
  },
  {
    email: "ayse@attendly.com",
    name: "Ayse Kaya",
    role: MembershipRole.STUDENT,
  },
  {
    email: "mehmet@attendly.com",
    name: "Mehmet Celik",
    role: MembershipRole.STUDENT,
  },
] as const;

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}

function setTime(date: Date, hours: number, minutes: number) {
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function getRequiredSeedUser(
  usersByEmail: Map<
    string,
    {
      id: string;
      email: string;
      name: string | null;
      role: MembershipRole;
      membershipId: string;
    }
  >,
  email: string,
) {
  const user = usersByEmail.get(email);

  if (!user) {
    throw new Error(`Required demo user was not created: ${email}`);
  }

  return user;
}

async function main() {
  const passwordHash = await hashPassword(devPassword);

  const demoOrganization = await db.organization.upsert({
    where: {
      slug: organization.slug,
    },
    update: {
      name: organization.name,
      status: organization.status,
    },
    create: organization,
  });

  const usersByEmail = new Map<
    string,
    {
      id: string;
      email: string;
      name: string | null;
      role: MembershipRole;
      membershipId: string;
    }
  >();

  for (const seedUser of seedUsers) {
    const user = await db.user.upsert({
      where: {
        email: seedUser.email,
      },
      update: {
        name: seedUser.name,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    const membership = await db.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: demoOrganization.id,
          userId: user.id,
        },
      },
      update: {
        role: seedUser.role,
      },
      create: {
        organizationId: demoOrganization.id,
        userId: user.id,
        role: seedUser.role,
      },
    });

    usersByEmail.set(seedUser.email, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: seedUser.role,
      membershipId: membership.id,
    });
  }

  const adminUser = getRequiredSeedUser(usersByEmail, "admin@attendly.local");
  const instructorUser = getRequiredSeedUser(
    usersByEmail,
    "instructor@attendly.local",
  );
  const secondInstructorUser = getRequiredSeedUser(
    usersByEmail,
    "instructor2@attendly.local",
  );
  const demoStudent = getRequiredSeedUser(
    usersByEmail,
    "student@attendly.local",
  );
  const zeynep = getRequiredSeedUser(usersByEmail, "zeynep@attendly.com");
  const ali = getRequiredSeedUser(usersByEmail, "ali@attendly.com");
  const ayse = getRequiredSeedUser(usersByEmail, "ayse@attendly.com");
  const mehmet = getRequiredSeedUser(usersByEmail, "mehmet@attendly.com");

  const courseOne = await db.course.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE101",
      },
    },
    update: {
      title: "Bilgisayar Ağları",
      description: "Ağ temelleri, protokoller ve güvenli iletişim.",
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      code: "CSE101",
      title: "Bilgisayar Ağları",
      description: "Ağ temelleri, protokoller ve güvenli iletişim.",
      isActive: true,
    },
  });

  const courseTwo = await db.course.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE202",
      },
    },
    update: {
      title: "Yazılım Mühendisliği",
      description: "Takım çalışması, gereksinim analizi ve teslim süreçleri.",
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      code: "CSE202",
      title: "Yazılım Mühendisliği",
      description: "Takım çalışması, gereksinim analizi ve teslim süreçleri.",
      isActive: true,
    },
  });

  const roomOne = await db.room.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "B201",
      },
    },
    update: {
      name: "B201 Amfisi",
      description: "Ana yoklama demosu için sınıf.",
      address: "Attendly Demo Kampusu, B Blok",
      latitude: 41.0082,
      longitude: 28.9784,
      allowedRadiusMeters: 100,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      name: "B201 Amfisi",
      code: "B201",
      description: "Ana yoklama demosu için sınıf.",
      address: "Attendly Demo Kampusu, B Blok",
      latitude: 41.0082,
      longitude: 28.9784,
      allowedRadiusMeters: 100,
      isActive: true,
    },
  });

  const roomTwo = await db.room.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "LAB3A",
      },
    },
    update: {
      name: "Lab 3A",
      description: "Yazılım mühendisliği laboratuvarı.",
      address: "Attendly Demo Kampusu, C Blok",
      latitude: 41.0084,
      longitude: 28.9787,
      allowedRadiusMeters: 80,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      name: "Lab 3A",
      code: "LAB3A",
      description: "Yazılım mühendisliği laboratuvarı.",
      address: "Attendly Demo Kampusu, C Blok",
      latitude: 41.0084,
      longitude: 28.9787,
      allowedRadiusMeters: 80,
      isActive: true,
    },
  });

  const sectionOne = await db.section.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE101-A",
      },
    },
    update: {
      name: "Bilgisayar Ağları - Şube A",
      courseId: courseOne.id,
      instructorMembershipId: instructorUser.membershipId,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      courseId: courseOne.id,
      instructorMembershipId: instructorUser.membershipId,
      code: "CSE101-A",
      name: "Bilgisayar Ağları - Şube A",
      isActive: true,
    },
  });

  const sectionTwo = await db.section.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE202-A",
      },
    },
    update: {
      name: "Yazılım Mühendisliği - Şube A",
      courseId: courseTwo.id,
      instructorMembershipId: instructorUser.membershipId,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      courseId: courseTwo.id,
      instructorMembershipId: instructorUser.membershipId,
      code: "CSE202-A",
      name: "Yazılım Mühendisliği - Şube A",
      isActive: true,
    },
  });

  const sectionThree = await db.section.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE101-B",
      },
    },
    update: {
      name: "Bilgisayar Ağları - Şube B",
      courseId: courseOne.id,
      instructorMembershipId: secondInstructorUser.membershipId,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      courseId: courseOne.id,
      instructorMembershipId: secondInstructorUser.membershipId,
      code: "CSE101-B",
      name: "Bilgisayar Ağları - Şube B",
      isActive: true,
    },
  });

  async function upsertInstructorAssignment(
    sectionId: string,
    instructor: { membershipId: string },
  ) {
    await db.instructorSectionAssignment.upsert({
      where: {
        organizationId_instructorMembershipId_sectionId: {
          organizationId: demoOrganization.id,
          instructorMembershipId: instructor.membershipId,
          sectionId,
        },
      },
      update: {
        isActive: true,
        assignedAt: new Date(),
      },
      create: {
        organizationId: demoOrganization.id,
        instructorMembershipId: instructor.membershipId,
        sectionId,
        isActive: true,
      },
    });
  }

  await Promise.all([
    upsertInstructorAssignment(sectionOne.id, instructorUser),
    upsertInstructorAssignment(sectionTwo.id, instructorUser),
    upsertInstructorAssignment(sectionThree.id, secondInstructorUser),
  ]);

  const enrollments = new Map<string, { id: string }>();

  async function upsertEnrollment(
    sectionId: string,
    student: { membershipId: string; email: string },
  ) {
    const enrollment = await db.enrollment.upsert({
      where: {
        organizationId_sectionId_studentMembershipId: {
          organizationId: demoOrganization.id,
          sectionId,
          studentMembershipId: student.membershipId,
        },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        endedAt: null,
      },
      create: {
        organizationId: demoOrganization.id,
        sectionId,
        studentMembershipId: student.membershipId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    enrollments.set(`${sectionId}:${student.email}`, enrollment);
  }

  await Promise.all([
    upsertEnrollment(sectionOne.id, demoStudent),
    upsertEnrollment(sectionOne.id, zeynep),
    upsertEnrollment(sectionOne.id, ali),
    upsertEnrollment(sectionOne.id, ayse),
    upsertEnrollment(sectionTwo.id, demoStudent),
    upsertEnrollment(sectionTwo.id, ayse),
    upsertEnrollment(sectionTwo.id, mehmet),
    upsertEnrollment(sectionThree.id, zeynep),
    upsertEnrollment(sectionThree.id, mehmet),
  ]);

  const now = new Date();

  async function upsertSession(input: {
    title: string;
    description: string;
    sectionId: string;
    roomId: string;
    createdByMembershipId: string;
    startTime: Date;
    endTime: Date;
    status: AttendanceSessionStatus;
    geofenceLatitude: string | number | null;
    geofenceLongitude: string | number | null;
    geofenceRadiusMeters: number | null;
  }) {
    const existingSession = await db.attendanceSession.findFirst({
      where: {
        organizationId: demoOrganization.id,
        sectionId: input.sectionId,
        title: input.title,
      },
      select: {
        id: true,
      },
    });
    const sessionDetails = {
      title: input.title,
      description: input.description,
      sectionId: input.sectionId,
      roomId: input.roomId,
      createdByMembershipId: input.createdByMembershipId,
      startTime: input.startTime,
      endTime: input.endTime,
      status: input.status,
      lateThresholdMinutes: 10,
      geofenceLatitude: input.geofenceLatitude,
      geofenceLongitude: input.geofenceLongitude,
      geofenceAccuracyMeters: 8,
      geofenceRadiusMeters: input.geofenceRadiusMeters,
      geofenceCapturedAt: input.startTime,
      geofenceSource: AttendanceSessionGeofenceSource.ROOM,
    };

    return existingSession
      ? db.attendanceSession.update({
          where: {
            id_organizationId: {
              id: existingSession.id,
              organizationId: demoOrganization.id,
            },
          },
          data: sessionDetails,
        })
      : db.attendanceSession.create({
          data: {
            organizationId: demoOrganization.id,
            ...sessionDetails,
          },
        });
  }

  const activeSession = await upsertSession({
    title: "Demo Canlı Yoklama - CSE101-A",
    description:
      "Sunum akışı için aktif QR ve konum kontrollü yoklama oturumu.",
    sectionId: sectionOne.id,
    roomId: roomOne.id,
    createdByMembershipId: instructorUser.membershipId,
    startTime: addMinutes(now, -10),
    endTime: addMinutes(now, 50),
    status: AttendanceSessionStatus.ACTIVE,
    geofenceLatitude: roomOne.latitude?.toString() ?? null,
    geofenceLongitude: roomOne.longitude?.toString() ?? null,
    geofenceRadiusMeters: roomOne.allowedRadiusMeters,
  });

  const closedSessionOne = await upsertSession({
    title: "Geçmiş Yoklama - CSE101-A",
    description: "Dün tamamlanan ve rapor ekranını dolduran yoklama.",
    sectionId: sectionOne.id,
    roomId: roomOne.id,
    createdByMembershipId: instructorUser.membershipId,
    startTime: setTime(addDays(now, -1), 9, 0),
    endTime: setTime(addDays(now, -1), 9, 45),
    status: AttendanceSessionStatus.CLOSED,
    geofenceLatitude: roomOne.latitude?.toString() ?? null,
    geofenceLongitude: roomOne.longitude?.toString() ?? null,
    geofenceRadiusMeters: roomOne.allowedRadiusMeters,
  });

  const closedSessionTwo = await upsertSession({
    title: "Lab Yoklaması - CSE202-A",
    description: "Geçmiş laboratuvar oturumu ve güvenlik uyarısı örnekleri.",
    sectionId: sectionTwo.id,
    roomId: roomTwo.id,
    createdByMembershipId: instructorUser.membershipId,
    startTime: setTime(addDays(now, -2), 14, 0),
    endTime: setTime(addDays(now, -2), 14, 45),
    status: AttendanceSessionStatus.CLOSED,
    geofenceLatitude: roomTwo.latitude?.toString() ?? null,
    geofenceLongitude: roomTwo.longitude?.toString() ?? null,
    geofenceRadiusMeters: roomTwo.allowedRadiusMeters,
  });

  const seededSessionIds = [
    activeSession.id,
    closedSessionOne.id,
    closedSessionTwo.id,
  ];

  await db.attendanceAlert.deleteMany({
    where: {
      organizationId: demoOrganization.id,
      attendanceSessionId: {
        in: seededSessionIds,
      },
    },
  });
  await db.presenceCheck.deleteMany({
    where: {
      organizationId: demoOrganization.id,
      attendanceSessionId: {
        in: seededSessionIds,
      },
    },
  });
  await db.attendanceRecord.deleteMany({
    where: {
      organizationId: demoOrganization.id,
      attendanceSessionId: {
        in: seededSessionIds,
      },
    },
  });

  async function createAttendanceRecord(input: {
    sessionId: string;
    sectionId: string;
    student: {
      id: string;
      email: string;
      membershipId: string;
    };
    status: AttendanceRecordStatus;
    checkedInAt: Date;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    distanceMeters: number;
    rejectionReason?: string;
  }) {
    const enrollment = enrollments.get(`${input.sectionId}:${input.student.email}`);

    if (!enrollment) {
      throw new Error(`Enrollment not found for ${input.student.email}`);
    }

    return db.attendanceRecord.create({
      data: {
        organizationId: demoOrganization.id,
        attendanceSessionId: input.sessionId,
        studentMembershipId: input.student.membershipId,
        studentUserId: input.student.id,
        enrollmentId: enrollment.id,
        status: input.status,
        source: AttendanceSource.QR_SCAN,
        verificationLevel: AttendanceVerificationLevel.INITIAL_ONLY,
        checkedInAt: input.checkedInAt,
        locationLatitude: input.latitude,
        locationLongitude: input.longitude,
        locationAccuracyMeters: input.accuracyMeters,
        distanceMeters: input.distanceMeters,
        rejectionReason: input.rejectionReason ?? null,
        suspiciousFlag: input.status === AttendanceRecordStatus.REJECTED,
      },
    });
  }

  async function createPresenceCheck(input: {
    recordId: string;
    sessionId: string;
    student: {
      id: string;
      membershipId: string;
    };
    status: PresenceCheckStatus;
    checkedAt: Date;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    distanceMeters: number;
  }) {
    return db.presenceCheck.create({
      data: {
        organizationId: demoOrganization.id,
        attendanceSessionId: input.sessionId,
        attendanceRecordId: input.recordId,
        studentUserId: input.student.id,
        studentMembershipId: input.student.membershipId,
        checkType: PresenceCheckType.INITIAL_CHECK_IN,
        status: input.status,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        distanceToGeofenceMeters: input.distanceMeters,
        checkedAt: input.checkedAt,
        metadata: {
          seeded: true,
        },
      },
    });
  }

  const activeRecord = await createAttendanceRecord({
    sessionId: activeSession.id,
    sectionId: sectionOne.id,
    student: zeynep,
    status: AttendanceRecordStatus.PRESENT,
    checkedInAt: addMinutes(now, -5),
    latitude: 41.00821,
    longitude: 28.97842,
    accuracyMeters: 18,
    distanceMeters: 12,
  });

  const closedRecordOne = await createAttendanceRecord({
    sessionId: closedSessionOne.id,
    sectionId: sectionOne.id,
    student: demoStudent,
    status: AttendanceRecordStatus.PRESENT,
    checkedInAt: addMinutes(closedSessionOne.startTime, 4),
    latitude: 41.00822,
    longitude: 28.97843,
    accuracyMeters: 16,
    distanceMeters: 15,
  });

  const closedRecordTwo = await createAttendanceRecord({
    sessionId: closedSessionOne.id,
    sectionId: sectionOne.id,
    student: zeynep,
    status: AttendanceRecordStatus.LATE,
    checkedInAt: addMinutes(closedSessionOne.startTime, 14),
    latitude: 41.00825,
    longitude: 28.97848,
    accuracyMeters: 22,
    distanceMeters: 21,
  });

  const rejectedRecord = await createAttendanceRecord({
    sessionId: closedSessionOne.id,
    sectionId: sectionOne.id,
    student: ali,
    status: AttendanceRecordStatus.REJECTED,
    checkedInAt: addMinutes(closedSessionOne.startTime, 18),
    latitude: 41.017,
    longitude: 28.99,
    accuracyMeters: 35,
    distanceMeters: 1280,
    rejectionReason: "Konum disi",
  });

  const labRecord = await createAttendanceRecord({
    sessionId: closedSessionTwo.id,
    sectionId: sectionTwo.id,
    student: ayse,
    status: AttendanceRecordStatus.PRESENT,
    checkedInAt: addMinutes(closedSessionTwo.startTime, 6),
    latitude: 41.00841,
    longitude: 28.97871,
    accuracyMeters: 20,
    distanceMeters: 8,
  });

  await Promise.all([
    createPresenceCheck({
      recordId: activeRecord.id,
      sessionId: activeSession.id,
      student: zeynep,
      status: PresenceCheckStatus.INSIDE_GEOFENCE,
      checkedAt: activeRecord.checkedInAt ?? activeSession.startTime,
      latitude: 41.00821,
      longitude: 28.97842,
      accuracyMeters: 18,
      distanceMeters: 12,
    }),
    createPresenceCheck({
      recordId: closedRecordOne.id,
      sessionId: closedSessionOne.id,
      student: demoStudent,
      status: PresenceCheckStatus.INSIDE_GEOFENCE,
      checkedAt: closedRecordOne.checkedInAt ?? closedSessionOne.startTime,
      latitude: 41.00822,
      longitude: 28.97843,
      accuracyMeters: 16,
      distanceMeters: 15,
    }),
    createPresenceCheck({
      recordId: closedRecordTwo.id,
      sessionId: closedSessionOne.id,
      student: zeynep,
      status: PresenceCheckStatus.INSIDE_GEOFENCE,
      checkedAt: closedRecordTwo.checkedInAt ?? closedSessionOne.startTime,
      latitude: 41.00825,
      longitude: 28.97848,
      accuracyMeters: 22,
      distanceMeters: 21,
    }),
    createPresenceCheck({
      recordId: rejectedRecord.id,
      sessionId: closedSessionOne.id,
      student: ali,
      status: PresenceCheckStatus.OUTSIDE_GEOFENCE,
      checkedAt: rejectedRecord.checkedInAt ?? closedSessionOne.startTime,
      latitude: 41.017,
      longitude: 28.99,
      accuracyMeters: 35,
      distanceMeters: 1280,
    }),
    createPresenceCheck({
      recordId: labRecord.id,
      sessionId: closedSessionTwo.id,
      student: ayse,
      status: PresenceCheckStatus.INSIDE_GEOFENCE,
      checkedAt: labRecord.checkedInAt ?? closedSessionTwo.startTime,
      latitude: 41.00841,
      longitude: 28.97871,
      accuracyMeters: 20,
      distanceMeters: 8,
    }),
  ]);

  await db.attendanceAlert.createMany({
    data: [
      {
        organizationId: demoOrganization.id,
        attendanceSessionId: activeSession.id,
        studentUserId: ali.id,
        studentMembershipId: ali.membershipId,
        alertType: AttendanceAlertType.OUTSIDE_GEOFENCE,
        severity: AttendanceAlertSeverity.MEDIUM,
        message: "Öğrenci yoklama alanının dışından katılmaya çalıştı.",
        createdAt: addMinutes(now, -4),
      },
      {
        organizationId: demoOrganization.id,
        attendanceSessionId: closedSessionOne.id,
        attendanceRecordId: rejectedRecord.id,
        studentUserId: ali.id,
        studentMembershipId: ali.membershipId,
        alertType: AttendanceAlertType.LOW_ACCURACY_LOCATION,
        severity: AttendanceAlertSeverity.MEDIUM,
        message: "Konum doğruluğu düşük olduğu için deneme reddedildi.",
        createdAt: addMinutes(closedSessionOne.startTime, 18),
      },
      {
        organizationId: demoOrganization.id,
        attendanceSessionId: closedSessionOne.id,
        attendanceRecordId: closedRecordTwo.id,
        studentUserId: zeynep.id,
        studentMembershipId: zeynep.membershipId,
        alertType: AttendanceAlertType.DUPLICATE_CHECK_IN_ATTEMPT,
        severity: AttendanceAlertSeverity.LOW,
        message: "Daha önce yoklaması alınmış öğrenci tekrar denedi.",
        createdAt: addMinutes(closedSessionOne.startTime, 25),
      },
      {
        organizationId: demoOrganization.id,
        attendanceSessionId: closedSessionTwo.id,
        studentUserId: mehmet.id,
        studentMembershipId: mehmet.membershipId,
        alertType: AttendanceAlertType.EXPIRED_TOKEN_ATTEMPT,
        severity: AttendanceAlertSeverity.LOW,
        message: "Süresi dolmuş QR token ile giriş denemesi yapıldı.",
        createdAt: addMinutes(closedSessionTwo.endTime, 20),
      },
      {
        organizationId: demoOrganization.id,
        attendanceSessionId: closedSessionTwo.id,
        studentUserId: demoStudent.id,
        studentMembershipId: demoStudent.membershipId,
        alertType: AttendanceAlertType.SESSION_CLOSED_ATTEMPT,
        severity: AttendanceAlertSeverity.MEDIUM,
        message: "Kapatılmış oturuma sonradan katılım denemesi yapıldı.",
        createdAt: addMinutes(closedSessionTwo.endTime, 30),
      },
    ],
  });

  await db.auditLog.deleteMany({
    where: {
      organizationId: demoOrganization.id,
      OR: [
        {
          action: "DEMO_SEED_REFRESHED",
        },
        {
          targetId: {
            in: seededSessionIds,
          },
        },
      ],
    },
  });

  await db.auditLog.createMany({
    data: [
      {
        organizationId: demoOrganization.id,
        actorUserId: adminUser.id,
        action: "DEMO_SEED_REFRESHED",
        targetType: "Organization",
        targetId: demoOrganization.id,
        metadata: {
          seeded: true,
        },
      },
      {
        organizationId: demoOrganization.id,
        actorUserId: instructorUser.id,
        action: "ATTENDANCE_SESSION_CREATED",
        targetType: "AttendanceSession",
        targetId: activeSession.id,
        metadata: {
          title: activeSession.title,
        },
      },
    ],
  });

  console.log("Seeded Attendly development data:");
  console.log(`Organization: ${demoOrganization.name}`);
  console.log(`Courses: ${courseOne.title}, ${courseTwo.title}`);
  console.log(`Rooms: ${roomOne.name}, ${roomTwo.name}`);
  console.log(
    `Sections: ${sectionOne.code}, ${sectionTwo.code}, ${sectionThree.code}`,
  );
  console.log(`Active demo session: ${activeSession.title}`);
  console.log("Seeded development users:");
  for (const seedUser of seedUsers) {
    console.log(`- ${seedUser.email} / ${devPassword}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
