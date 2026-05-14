-- CreateEnum
CREATE TYPE "AttendanceVerificationLevel" AS ENUM ('INITIAL_ONLY', 'MID_SESSION_VERIFIED', 'CONTINUOUSLY_VERIFIED', 'SUSPICIOUS', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "PresenceCheckType" AS ENUM ('INITIAL_CHECK_IN', 'PERIODIC_LOCATION', 'MID_SESSION_QR', 'MANUAL_CHECK');

-- CreateEnum
CREATE TYPE "PresenceCheckStatus" AS ENUM ('INSIDE_GEOFENCE', 'OUTSIDE_GEOFENCE', 'LOCATION_UNAVAILABLE', 'QR_NOT_CONFIRMED', 'SUSPICIOUS', 'VERIFIED');

-- CreateEnum
CREATE TYPE "AttendanceAlertType" AS ENUM ('LEFT_GEOFENCE', 'MISSED_MID_SESSION_CHECK', 'LOCATION_PERMISSION_LOST', 'SUSPICIOUS_RECHECK', 'DUPLICATE_ATTEMPT', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "AttendanceAlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "attendance_records"
ADD COLUMN "verificationLevel" "AttendanceVerificationLevel" NOT NULL DEFAULT 'INITIAL_ONLY',
ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN "suspiciousFlag" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "presence_checks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "attendanceRecordId" TEXT,
    "studentUserId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "checkType" "PresenceCheckType" NOT NULL,
    "status" "PresenceCheckStatus" NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "accuracyMeters" INTEGER,
    "distanceToGeofenceMeters" DECIMAL(10,2),
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "attendanceRecordId" TEXT,
    "studentUserId" TEXT,
    "studentMembershipId" TEXT,
    "alertType" "AttendanceAlertType" NOT NULL,
    "severity" "AttendanceAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByMembershipId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_id_organizationId_key" ON "attendance_records"("id", "organizationId");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_verificationLevel_idx" ON "attendance_records"("organizationId", "verificationLevel");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_suspiciousFlag_idx" ON "attendance_records"("organizationId", "suspiciousFlag");

-- CreateIndex
CREATE INDEX "presence_checks_organizationId_attendanceSessionId_idx" ON "presence_checks"("organizationId", "attendanceSessionId");

-- CreateIndex
CREATE INDEX "presence_checks_organizationId_studentUserId_idx" ON "presence_checks"("organizationId", "studentUserId");

-- CreateIndex
CREATE INDEX "presence_checks_organizationId_checkType_idx" ON "presence_checks"("organizationId", "checkType");

-- CreateIndex
CREATE INDEX "presence_checks_organizationId_status_idx" ON "presence_checks"("organizationId", "status");

-- CreateIndex
CREATE INDEX "presence_checks_organizationId_checkedAt_idx" ON "presence_checks"("organizationId", "checkedAt");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_attendanceSessionId_idx" ON "attendance_alerts"("organizationId", "attendanceSessionId");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_studentUserId_idx" ON "attendance_alerts"("organizationId", "studentUserId");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_alertType_idx" ON "attendance_alerts"("organizationId", "alertType");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_isResolved_idx" ON "attendance_alerts"("organizationId", "isResolved");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_severity_isResolved_idx" ON "attendance_alerts"("organizationId", "severity", "isResolved");

-- CreateIndex
CREATE INDEX "attendance_alerts_organizationId_createdAt_idx" ON "attendance_alerts"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "presence_checks" ADD CONSTRAINT "presence_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_checks" ADD CONSTRAINT "presence_checks_attendanceSessionId_organizationId_fkey" FOREIGN KEY ("attendanceSessionId", "organizationId") REFERENCES "attendance_sessions"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_checks" ADD CONSTRAINT "presence_checks_attendanceRecordId_organizationId_fkey" FOREIGN KEY ("attendanceRecordId", "organizationId") REFERENCES "attendance_records"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_checks" ADD CONSTRAINT "presence_checks_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_checks" ADD CONSTRAINT "presence_checks_studentMembershipId_organizationId_fkey" FOREIGN KEY ("studentMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_attendanceSessionId_organizationId_fkey" FOREIGN KEY ("attendanceSessionId", "organizationId") REFERENCES "attendance_sessions"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_attendanceRecordId_organizationId_fkey" FOREIGN KEY ("attendanceRecordId", "organizationId") REFERENCES "attendance_records"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_studentMembershipId_organizationId_fkey" FOREIGN KEY ("studentMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_resolvedByMembershipId_organizationId_fkey" FOREIGN KEY ("resolvedByMembershipId", "organizationId") REFERENCES "memberships"("id", "organizationId") ON DELETE NO ACTION ON UPDATE CASCADE;
