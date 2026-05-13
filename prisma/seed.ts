import "dotenv/config";

import { MembershipRole, UserStatus } from "../lib/generated/prisma/enums";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";

const organization = {
  name: "Attendly Demo University",
  slug: "demo-university",
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
    },
    create: organization,
  });

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
  }

  console.log("Seeded Attendly development users:");
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
