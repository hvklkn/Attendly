import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function StudentScanResultPage() {
  return (
    <>
      <PageHeader
        title="Scan Result"
        description="Result placeholder for successful, pending, or failed check-in states."
      />

      <SectionCard
        title="Check-in status"
        description="This area will show the result of QR validation after the scanner flow exists."
      >
        <div className="mb-5">
          <StatusBadge label="Pending implementation" tone="warning" />
        </div>
        <EmptyState
          title="No scan result"
          description="Result messaging will connect to QR validation and attendance event creation in a later increment."
        />
      </SectionCard>
    </>
  );
}
