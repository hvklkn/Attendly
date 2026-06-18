-- Store demo check-in distance and user-facing rejection details on attendance records.
ALTER TABLE "attendance_records"
  ADD COLUMN "distanceMeters" DECIMAL(10, 2),
  ADD COLUMN "rejectionReason" TEXT;
