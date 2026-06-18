import "dotenv/config";

import {
  AttendanceSessionGeofenceSource,
  AttendanceSessionStatus,
  MembershipRole,
  UserStatus,
  EnrollmentStatus,
  OrganizationStatus,
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
    name: "Attendly Instructor",
    role: MembershipRole.INSTRUCTOR,
  },
  {
    email: "student@attendly.local",
    name: "Attendly Student",
    role: MembershipRole.STUDENT,
  },
] as const;

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

  const createdUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    role: MembershipRole;
  }> = [];

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

    await db.membership.upsert({
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

    createdUsers.push({
      id: user.id,
      email: user.email,
      name: user.name,
      role: seedUser.role,
    });
  }

  const instructorUser = createdUsers.find(
    (user) => user.role === MembershipRole.INSTRUCTOR
  );
  const studentUser = createdUsers.find(
    (user) => user.role === MembershipRole.STUDENT
  );

  if (!instructorUser) {
    throw new Error("Instructor user was not created.");
  }

  if (!studentUser) {
    throw new Error("Student user was not created.");
  }

  const instructorMembership = await db.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: demoOrganization.id,
        userId: instructorUser.id,
      },
    },
  });

  const studentMembership = await db.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: demoOrganization.id,
        userId: studentUser.id,
      },
    },
  });

  if (!instructorMembership) {
    throw new Error("Instructor membership was not found.");
  }

  if (!studentMembership) {
    throw new Error("Student membership was not found.");
  }

  // Courses
  const courseOne = await db.course.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE101",
      },
    },
    update: {},
    create: {
      organizationId: demoOrganization.id,
      code: "CSE101",
      title: "Computer Networks",
      description: "Introduction to networking concepts and protocols.",
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
    update: {},
    create: {
      organizationId: demoOrganization.id,
      code: "CSE202",
      title: "Software Engineering",
      description: "Software lifecycle, architecture, and team development.",
      isActive: true,
    },
  });

  // Rooms
  const roomOne = await db.room.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "B201",
      },
    },
    update: {
      name: "Room B201",
      description: "Main classroom for networking sessions.",
      latitude: 41.0082,
      longitude: 28.9784,
      allowedRadiusMeters: 100,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      name: "Room B201",
      code: "B201",
      description: "Main classroom for networking sessions.",
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
      description: "Software engineering laboratory.",
      latitude: 41.0084,
      longitude: 28.9787,
      allowedRadiusMeters: 80,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      name: "Lab 3A",
      code: "LAB3A",
      description: "Software engineering laboratory.",
      latitude: 41.0084,
      longitude: 28.9787,
      allowedRadiusMeters: 80,
      isActive: true,
    },
  });

  // Sections
  const sectionOne = await db.section.upsert({
    where: {
      organizationId_code: {
        organizationId: demoOrganization.id,
        code: "CSE101-A",
      },
    },
    update: {
      name: "Computer Networks - Section A",
      courseId: courseOne.id,
      instructorMembershipId: instructorMembership.id,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      courseId: courseOne.id,
      instructorMembershipId: instructorMembership.id,
      code: "CSE101-A",
      name: "Computer Networks - Section A",
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
      name: "Software Engineering - Section A",
      courseId: courseTwo.id,
      instructorMembershipId: instructorMembership.id,
      isActive: true,
    },
    create: {
      organizationId: demoOrganization.id,
      courseId: courseTwo.id,
      instructorMembershipId: instructorMembership.id,
      code: "CSE202-A",
      name: "Software Engineering - Section A",
      isActive: true,
    },
  });

  // Enrollment
  await db.enrollment.upsert({
    where: {
      organizationId_sectionId_studentMembershipId: {
        organizationId: demoOrganization.id,
        sectionId: sectionOne.id,
        studentMembershipId: studentMembership.id,
      },
    },
    update: {
      status: EnrollmentStatus.ACTIVE,
    },
    create: {
      organizationId: demoOrganization.id,
      sectionId: sectionOne.id,
      studentMembershipId: studentMembership.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const demoSessionTitle = "Demo Yoklama Oturumu";
  const now = new Date();
  const demoSessionStartTime = new Date(now.getTime() - 10 * 60 * 1000);
  const demoSessionEndTime = new Date(now.getTime() + 50 * 60 * 1000);
  const existingDemoSession = await db.attendanceSession.findFirst({
    where: {
      organizationId: demoOrganization.id,
      sectionId: sectionOne.id,
      title: demoSessionTitle,
    },
    select: {
      id: true,
    },
  });
  const demoSessionDetails = {
    title: demoSessionTitle,
    description:
      "Demo akışı için aktif QR ve konum kontrollü yoklama oturumu.",
    startTime: demoSessionStartTime,
    endTime: demoSessionEndTime,
    status: AttendanceSessionStatus.ACTIVE,
    lateThresholdMinutes: 15,
    geofenceLatitude: roomOne.latitude,
    geofenceLongitude: roomOne.longitude,
    geofenceAccuracyMeters: 10,
    geofenceRadiusMeters: roomOne.allowedRadiusMeters,
    geofenceCapturedAt: now,
    geofenceSource: AttendanceSessionGeofenceSource.ROOM,
  };
  const demoSession = existingDemoSession
    ? await db.attendanceSession.update({
        where: {
          id_organizationId: {
            id: existingDemoSession.id,
            organizationId: demoOrganization.id,
          },
        },
        data: demoSessionDetails,
      })
    : await db.attendanceSession.create({
        data: {
          organizationId: demoOrganization.id,
          sectionId: sectionOne.id,
          roomId: roomOne.id,
          createdByMembershipId: instructorMembership.id,
          ...demoSessionDetails,
        },
      });

  console.log("Seeded Attendly development data:");
  console.log(`Organization: ${demoOrganization.name}`);
  console.log(`Courses: ${courseOne.title}, ${courseTwo.title}`);
  console.log(`Rooms: ${roomOne.name}, ${roomTwo.name}`);
  console.log(`Sections: ${sectionOne.name}, ${sectionTwo.name}`);
  console.log(`Active demo session: ${demoSession.title}`);
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
