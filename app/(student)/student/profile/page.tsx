import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function StudentProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Student profile foundation for identity, enrollment, and attendance preferences."
      />

      <SectionCard
        title="Profile details"
        description="Prepared for future user profile data from the auth and tenant model."
      >
        <EmptyState
          title="Profile not connected"
          description="Profile details will be introduced after authentication and student membership are implemented."
        />
      </SectionCard>
    </>
  );
}
