import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { routes } from "@/constants/routes";

export default function StudentScanPage() {
  return (
    <>
      <PageHeader
        title="Scan QR Code"
        description="Mobile-first placeholder for student attendance check-in."
      >
        <Link
          href={routes.student.scanResult}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
        >
          View result
        </Link>
      </PageHeader>

      <SectionCard
        title="Scanner area"
        description="Camera access and QR validation will be added in a later step."
      >
        <EmptyState
          title="Scanner not implemented"
          description="This page reserves the student check-in flow without adding QR scanning logic yet."
        />
      </SectionCard>
    </>
  );
}
