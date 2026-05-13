import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function InstructorSessionsPage() {
  return (
    <>
      <PageHeader
        title="Sessions"
        description="Instructor view for assigned attendance sessions."
      />

      <SectionCard
        title="Assigned sessions"
        description="List placeholder for sessions owned by or assigned to the instructor."
      >
        <EmptyState
          title="No assigned sessions"
          description="Instructor session records will appear after role-aware assignment and session persistence are implemented."
        />
      </SectionCard>
    </>
  );
}
