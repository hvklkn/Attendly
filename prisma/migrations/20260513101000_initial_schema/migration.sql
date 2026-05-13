-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'INSTRUCTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceRecordStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'REJECTED', 'MANUAL');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('QR_SCAN', 'MANUAL_ENTRY', 'SYSTEM_GENERATED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'SUSPENDED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "allowedRadiusMeters" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorMembershipId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "roomId" TEXT,
    "createdByMembershipId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "createdByMembershipId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "status" "AttendanceRecordStatus" NOT NULL,
    "source" "AttendanceSource" NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "locationLatitude" DECIMAL(9,6),
    "locationLongitude" DECIMAL(9,6),
    "locationAccuracyMeters" INTEGER,
    "deviceIdHash" TEXT,
    "deviceUserAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "memberships_organizationId_role_idx" ON "memberships"("organizationId", "role");

-- CreateIndex
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_id_organizationId_key" ON "memberships"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_id_organizationId_userId_key" ON "memberships"("id", "organizationId", "userId");

-- CreateIndex
CREATE INDEX "rooms_organizationId_name_idx" ON "rooms"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_organizationId_code_key" ON "rooms"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_id_organizationId_key" ON "rooms"("id", "organizationId");

-- CreateIndex
CREATE INDEX "courses_organizationId_isActive_idx" ON "courses"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "courses_organizationId_code_key" ON "courses"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_id_organizationId_key" ON "courses"("id", "organizationId");

-- CreateIndex
CREATE INDEX "sections_organizationId_courseId_idx" ON "sections"("organizationId", "courseId");

-- CreateIndex
CREATE INDEX "sections_organizationId_instructorMembershipId_idx" ON "sections"("organizationId", "instructorMembershipId");

-- CreateIndex
CREATE INDEX "sections_organizationId_isActive_idx" ON "sections"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sections_organizationId_code_key" ON "sections"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sections_id_organizationId_key" ON "sections"("id", "organizationId");

-- CreateIndex
CREATE INDEX "enrollments_organizationId_status_idx" ON "enrollments"("organizationId", "status");

-- CreateIndex
CREATE INDEX "enrollments_organizationId_studentMembershipId_idx" ON "enrollments"("organizationId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_organizationId_sectionId_studentMembershipId_key" ON "enrollments"("organizationId", "sectionId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_id_organizationId_key" ON "enrollments"("id", "organizationId");

-- CreateIndex
CREATE INDEX "attendance_sessions_organizationId_status_idx" ON "attendance_sessions"("organizationId", "status");

-- CreateIndex
CREATE INDEX "attendance_sessions_organizationId_sectionId_startTime_idx" ON "attendance_sessions"("organizationId", "sectionId", "startTime");

-- CreateIndex
CREATE INDEX "attendance_sessions_organizationId_roomId_idx" ON "attendance_sessions"("organizationId", "roomId");

-- CreateIndex
CREATE INDEX "attendance_sessions_organizationId_createdByMembershipId_idx" ON "attendance_sessions"("organizationId", "createdByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_id_organizationId_key" ON "attendance_sessions"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_tokenHash_key" ON "qr_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "qr_tokens_organizationId_attendanceSessionId_revokedAt_expi_idx" ON "qr_tokens"("organizationId", "attendanceSessionId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "qr_tokens_organizationId_expiresAt_idx" ON "qr_tokens"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_status_idx" ON "attendance_records"("organizationId", "status");

-- CreateIndex
CREATE INDEX "attendance_records_attendanceSessionId_status_idx" ON "attendance_records"("attendanceSessionId", "status");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_studentUserId_checkedInAt_idx" ON "attendance_records"("organizationId", "studentUserId", "checkedInAt");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_source_idx" ON "attendance_records"("organizationId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_organizationId_attendanceSessionId_stude_key" ON "attendance_records"("organizationId", "attendanceSessionId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_targetType_targetId_idx" ON "audit_logs"("organizationId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_sessions_sessionTokenHash_key" ON "device_sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "device_sessions_organizationId_userId_idx" ON "device_sessions"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "device_sessions_userId_expiresAt_idx" ON "device_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "device_sessions_organizationId_expiresAt_idx" ON "device_sessions"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "device_sessions_organizationId_lastSeenAt_idx" ON "device_sessions"("organizationId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_organizationId_fkey" FOREIGN KEY ("courseId", "organizationId") REFERENCES "courses"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_instructorMembershipId_organizationId_fkey" FOREIGN KEY ("instructorMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_sectionId_organizationId_fkey" FOREIGN KEY ("sectionId", "organizationId") REFERENCES "sections"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentMembershipId_organizationId_fkey" FOREIGN KEY ("studentMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_sectionId_organizationId_fkey" FOREIGN KEY ("sectionId", "organizationId") REFERENCES "sections"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_roomId_organizationId_fkey" FOREIGN KEY ("roomId", "organizationId") REFERENCES "rooms"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_createdByMembershipId_organizationId_fkey" FOREIGN KEY ("createdByMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_attendanceSessionId_organizationId_fkey" FOREIGN KEY ("attendanceSessionId", "organizationId") REFERENCES "attendance_sessions"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_createdByMembershipId_organizationId_fkey" FOREIGN KEY ("createdByMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendanceSessionId_organizationId_fkey" FOREIGN KEY ("attendanceSessionId", "organizationId") REFERENCES "attendance_sessions"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentMembershipId_organizationId_stud_fkey" FOREIGN KEY ("studentMembershipId", "organizationId", "studentUserId") REFERENCES "memberships"("id", "organizationId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollmentId_organizationId_fkey" FOREIGN KEY ("enrollmentId", "organizationId") REFERENCES "enrollments"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
