import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminSessionDetailPage() {
  return (
    <>
      <PageHeader
        title="Session Detail"
        description="Admin placeholder for session metadata, QR access, attendance records, and participation controls."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatusBadge label="Session shell" tone="info" />
        <StatusBadge label="Attendance pending" tone="neutral" />
        <StatusBadge label="Reports pending" tone="neutral" />
      </section>

      <SectionCard
        title="Session workspace"
        description="Detailed session behavior will be implemented after the core data model is introduced."
      >
        <EmptyState
          title="Session detail placeholder"
          description="This route is ready for QR generation, roster views, check-in status, and session reporting in later increments."
        />
      </SectionCard>
    </>
  );
}
