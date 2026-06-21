-- Store optional institution-specific student numbers for CSV import.
ALTER TABLE "memberships" ADD COLUMN "studentNo" TEXT;

CREATE INDEX "memberships_organizationId_studentNo_idx"
  ON "memberships"("organizationId", "studentNo");
