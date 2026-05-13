import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="py-8">
        <StatusBadge label="Initial SaaS scaffold" tone="success" />
        <div className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
            Attendly
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Multi-tenant QR attendance and participation management for
            universities, training centers, academies, and internal learning
            teams.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={routes.public.login}
            className="rounded-md bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Login
          </Link>
          <Link
            href={routes.public.features}
            className="rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            View features
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Role areas"
          value="3"
          description="Admin, instructor, and student route foundations."
        />
        <StatCard
          label="App routes"
          value="15"
          description="Public, auth, and protected-area placeholders."
        />
        <StatCard
          label="Business logic"
          value="0"
          description="Intentionally deferred for safe incremental work."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Workspace previews"
          description="Role routes are scaffolded now and ready for auth guards later."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={routes.admin.dashboard}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Admin
            </Link>
            <Link
              href={routes.instructor.dashboard}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Instructor
            </Link>
            <Link
              href={routes.student.scan}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Student
            </Link>
          </div>
        </SectionCard>
        <SectionCard title="Current scope">
          <EmptyState
            title="Foundation only"
            description="This scaffold focuses on app structure, route shape, layout systems, and reusable UI pieces. Data, auth, QR scanning, and reporting will be added in later steps."
          />
        </SectionCard>
      </section>
    </div>
  );
}
