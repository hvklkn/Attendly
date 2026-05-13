import {
  CalendarPlus,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";

const sessions = [
  {
    id: "session-001",
    title: "Data Structures Lab",
    section: "CS-204 A",
    instructor: "Dr. Mira Stone",
    room: "Engineering 204",
    startsAt: "Today, 09:30",
    status: "Scheduled",
    checkins: "0 / 42",
  },
  {
    id: "session-002",
    title: "Corporate Onboarding",
    section: "May Cohort",
    instructor: "Nora Patel",
    room: "Training Room 2",
    startsAt: "Today, 13:00",
    status: "Ready",
    checkins: "0 / 28",
  },
  {
    id: "session-003",
    title: "Product Analytics",
    section: "Evening Academy",
    instructor: "Leo Chen",
    room: "Remote",
    startsAt: "Tomorrow, 18:00",
    status: "Draft",
    checkins: "0 / 31",
  },
];

function getSessionTone(status: string) {
  if (status === "Ready") return "success" as const;
  if (status === "Draft") return "warning" as const;
  return "info" as const;
}

export default function AdminSessionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Attendance operations"
        title="Sessions"
        description="Create, schedule, and monitor attendance sessions across sections and rooms."
      >
        <ButtonLink
          href={routes.admin.sessionCreate}
          variant="primary"
          icon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
        >
          New session
        </ButtonLink>
      </PageHeader>

      <SectionCard
        title="Session directory"
        description="Mock session rows show the intended management surface before live data is connected."
        actions={
          <ButtonLink
            href={routes.admin.reports}
            icon={<Download className="h-4 w-4" aria-hidden="true" />}
          >
            Export
          </ButtonLink>
        }
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search sessions</span>
            <input
              placeholder="Search sessions"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Status
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            More filters
          </button>
        </div>

        {sessions.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Check-ins</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {session.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {session.section}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {session.instructor}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {session.room}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {session.startsAt}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {session.checkins}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={session.status}
                          tone={getSessionTone(session.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ButtonLink
                          href={`/admin/sessions/${session.id}`}
                          variant="ghost"
                        >
                          View
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {sessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-950">
                        {session.title}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {session.section}
                      </p>
                    </div>
                    <StatusBadge
                      label={session.status}
                      tone={getSessionTone(session.status)}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-neutral-500">Start</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {session.startsAt}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Check-ins</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {session.checkins}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-neutral-500">Instructor</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {session.instructor}
                      </dd>
                    </div>
                  </dl>
                  <ButtonLink
                    href={`/admin/sessions/${session.id}`}
                    className="mt-4 w-full"
                  >
                    View session
                  </ButtonLink>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No sessions yet"
            description="Session records will appear here after attendance workflows and persistence are connected."
            actionHref={routes.admin.sessionCreate}
            actionLabel="Create session"
          />
        )}
      </SectionCard>
    </>
  );
}
