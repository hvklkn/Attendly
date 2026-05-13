import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration placeholder for tenant profile, role defaults, and attendance policies."
      />

      <SectionCard
        title="Workspace settings"
        description="Tenant-aware configuration will be introduced after the data model is defined."
      >
        <EmptyState
          title="Settings are not connected"
          description="This area is reserved for organization profile, permissions, and session defaults in later increments."
        />
      </SectionCard>
    </>
  );
}
