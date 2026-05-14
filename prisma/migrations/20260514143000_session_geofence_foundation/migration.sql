-- CreateEnum
CREATE TYPE "AttendanceSessionGeofenceSource" AS ENUM ('DEVICE', 'ROOM', 'MANUAL', 'NONE');

-- AlterTable
ALTER TABLE "attendance_sessions"
ADD COLUMN "geofenceLatitude" DECIMAL(9,6),
ADD COLUMN "geofenceLongitude" DECIMAL(9,6),
ADD COLUMN "geofenceAccuracyMeters" DECIMAL(10,2),
ADD COLUMN "geofenceRadiusMeters" INTEGER,
ADD COLUMN "geofenceCapturedAt" TIMESTAMP(3),
ADD COLUMN "geofenceSource" "AttendanceSessionGeofenceSource" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "attendance_sessions_organizationId_geofenceSource_idx" ON "attendance_sessions"("organizationId", "geofenceSource");
