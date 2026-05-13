import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Reporting foundation for attendance summaries, participation trends, and exports."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Attendance rate"
          value="--"
          description="Calculated reporting metric placeholder."
        />
        <StatCard
          label="Sessions reported"
          value="--"
          description="Future reporting coverage metric."
        />
        <StatCard
          label="Exports"
          value="--"
          description="Export workflows are intentionally deferred."
        />
      </section>

      <SectionCard title="Report builder">
        <EmptyState
          title="No report data yet"
          description="Reports will connect after attendance events, session metadata, and tenant-aware filtering exist."
        />
      </SectionCard>
    </>
  );
}
