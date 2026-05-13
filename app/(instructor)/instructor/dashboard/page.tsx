import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";

export default function InstructorDashboardPage() {
  return (
    <>
      <PageHeader
        title="Instructor Dashboard"
        description="Teaching overview for upcoming sessions and attendance activity."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Upcoming sessions"
          value="0"
          description="Future sessions assigned to the instructor."
        />
        <StatCard
          label="Active check-ins"
          value="0"
          description="Live attendance status placeholder."
        />
        <StatCard
          label="Needs review"
          value="0"
          description="Future exceptions and manual review count."
        />
      </section>

      <SectionCard
        title="Teaching workspace"
        description="Prepared for instructor-specific session management."
      >
        <EmptyState
          title="No instructor data yet"
          description="Assigned sessions and attendance activity will appear here after auth and persistence are added."
        />
      </SectionCard>
    </>
  );
}
