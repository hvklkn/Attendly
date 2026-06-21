-- CreateTable
CREATE TABLE "instructor_section_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instructorMembershipId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_section_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "isa_org_instructor_section_key" ON "instructor_section_assignments"("organizationId", "instructorMembershipId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "isa_id_org_key" ON "instructor_section_assignments"("id", "organizationId");

-- CreateIndex
CREATE INDEX "isa_org_instructor_active_idx" ON "instructor_section_assignments"("organizationId", "instructorMembershipId", "isActive");

-- CreateIndex
CREATE INDEX "isa_org_section_active_idx" ON "instructor_section_assignments"("organizationId", "sectionId", "isActive");

-- AddForeignKey
ALTER TABLE "instructor_section_assignments" ADD CONSTRAINT "isa_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_section_assignments" ADD CONSTRAINT "isa_instructor_org_fkey" FOREIGN KEY ("instructorMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_section_assignments" ADD CONSTRAINT "isa_section_org_fkey" FOREIGN KEY ("sectionId", "organizationId") REFERENCES "sections"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Backfill existing single responsible instructor relation into active assignments.
INSERT INTO "instructor_section_assignments" (
    "id",
    "organizationId",
    "instructorMembershipId",
    "sectionId",
    "isActive",
    "assignedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('isa_', MD5(CONCAT(s."organizationId", ':', s."instructorMembershipId", ':', s."id"))),
    s."organizationId",
    s."instructorMembershipId",
    s."id",
    true,
    COALESCE(s."createdAt", CURRENT_TIMESTAMP),
    COALESCE(s."createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM "sections" s
JOIN "memberships" m
    ON m."id" = s."instructorMembershipId"
   AND m."organizationId" = s."organizationId"
WHERE s."instructorMembershipId" IS NOT NULL
ON CONFLICT ("organizationId", "instructorMembershipId", "sectionId") DO NOTHING;
