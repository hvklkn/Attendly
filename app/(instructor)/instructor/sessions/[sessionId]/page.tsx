import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function InstructorSessionDetailPage() {
  return (
    <>
      <PageHeader
        title="Session Detail"
        description="Instructor placeholder for managing a live or scheduled attendance session."
      />

      <SectionCard
        title="Instructor session tools"
        description="Future tools will include roster visibility, QR availability, and attendance review."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          <StatusBadge label="QR pending" tone="neutral" />
          <StatusBadge label="Roster pending" tone="neutral" />
          <StatusBadge label="Review pending" tone="neutral" />
        </div>
        <EmptyState
          title="Session tools are not connected"
          description="This route is ready for instructor workflows once the session model and permissions are introduced."
        />
      </SectionCard>
    </>
  );
}
