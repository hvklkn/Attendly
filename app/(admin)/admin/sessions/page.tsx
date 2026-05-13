import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { routes } from "@/constants/routes";

export default function AdminSessionsPage() {
  return (
    <>
      <PageHeader
        title="Sessions"
        description="Admin workspace for creating and managing attendance sessions."
      >
        <Link
          href={routes.admin.sessionCreate}
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          New session
        </Link>
      </PageHeader>

      <SectionCard
        title="Session list"
        description="Table structure placeholder for future session data."
      >
        <div className="mb-3 hidden grid-cols-[1fr_160px_120px] gap-4 border-b border-neutral-100 pb-3 text-xs font-medium uppercase tracking-normal text-neutral-500 sm:grid">
          <span>Session</span>
          <span>Schedule</span>
          <span>Status</span>
        </div>
        <EmptyState
          title="No sessions yet"
          description="Session records will appear here after the attendance workflow and persistence layer are implemented."
          actionHref={routes.admin.sessionCreate}
          actionLabel="Create placeholder"
        />
      </SectionCard>
    </>
  );
}
