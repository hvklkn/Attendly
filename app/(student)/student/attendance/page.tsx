import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function StudentAttendancePage() {
  return (
    <>
      <PageHeader
        title="Attendance History"
        description="Student-facing record of attendance and participation events."
      />

      <SectionCard
        title="History"
        description="Timeline placeholder for a student's attendance records."
      >
        <EmptyState
          title="No attendance records"
          description="Attendance history will appear after sessions, check-ins, and student identity are connected."
        />
      </SectionCard>
    </>
  );
}
