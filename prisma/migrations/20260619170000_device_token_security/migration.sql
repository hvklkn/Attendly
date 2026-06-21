ALTER TYPE "AttendanceAlertType" ADD VALUE IF NOT EXISTS 'MULTI_DEVICE_ATTEMPT';
ALTER TYPE "AttendanceAlertType" ADD VALUE IF NOT EXISTS 'SUSPICIOUS_TOKEN_REUSE';
ALTER TYPE "AttendanceAlertType" ADD VALUE IF NOT EXISTS 'TOKEN_REPLACED_BY_NEW_QR';
ALTER TYPE "AttendanceAlertType" ADD VALUE IF NOT EXISTS 'DEVICE_REGISTERED';

CREATE TABLE "attendance_devices" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fingerprintHash" TEXT NOT NULL,
  "userAgentSummary" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "attendance_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_devices_organizationId_userId_fingerprintHash_key"
  ON "attendance_devices"("organizationId", "userId", "fingerprintHash");

CREATE INDEX "attendance_devices_organizationId_userId_lastSeenAt_idx"
  ON "attendance_devices"("organizationId", "userId", "lastSeenAt");

CREATE INDEX "attendance_devices_organizationId_fingerprintHash_idx"
  ON "attendance_devices"("organizationId", "fingerprintHash");

ALTER TABLE "attendance_devices"
  ADD CONSTRAINT "attendance_devices_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_devices"
  ADD CONSTRAINT "attendance_devices_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;
