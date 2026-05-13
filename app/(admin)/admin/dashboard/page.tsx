import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { routes } from "@/constants/routes";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Workspace-level overview for attendance operations, users, sessions, and reports."
      >
        <Link
          href={routes.admin.sessionCreate}
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Create session
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active sessions"
          value="0"
          description="Session metrics will connect after data modeling."
        />
        <StatCard
          label="Users"
          value="0"
          description="User counts will connect after auth and roles."
        />
        <StatCard
          label="Reports"
          value="0"
          description="Report summaries will connect after attendance flows."
        />
      </section>

      <SectionCard
        title="Operations overview"
        description="A future home for workspace health, recent sessions, and participation trends."
      >
        <EmptyState
          title="No workspace data yet"
          description="This dashboard is ready for future Prisma models, auth context, attendance sessions, and reporting metrics."
        />
      </SectionCard>
    </>
  );
}
