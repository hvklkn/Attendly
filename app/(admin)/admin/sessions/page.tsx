import {
  CalendarDays,
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
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminSessionsData } from "@/lib/admin/queries";

type AdminSessionsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}

export default async function AdminSessionsPage({
  searchParams,
}: AdminSessionsPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const sessions = await getAdminSessionsData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow="Attendance operations"
        title="Sessions"
        description="Browse attendance sessions for the active organization. Creation and editing remain intentionally separate from this read-only pass."
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
        description="Read-only session records scoped to the current organization."
        actions={
          <ButtonLink
            href={routes.admin.reports}
            icon={<Download className="h-4 w-4" aria-hidden="true" />}
          >
            Reports
          </ButtonLink>
        }
      >
        <form
          action={routes.admin.sessions}
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_140px_180px_180px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search sessions</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search sessions"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-400"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Status
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-400"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            More filters
          </button>
        </form>

        {sessions.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">Records</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {sessions.map((session) => {
                    const creator =
                      session.createdByMembership?.user.name ??
                      session.createdByMembership?.user.email ??
                      "Unassigned";

                    return (
                      <tr key={session.id}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-neutral-950">
                            {session.title}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {session.section.course.code} ·{" "}
                            {session.section.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {creator}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {session.room?.name ?? "No room"}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {formatDateTime(session.startTime)}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {session._count.attendanceRecords} /{" "}
                          {session.section._count.enrollments}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            label={formatStatus(session.status)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {sessions.map((session) => {
                const creator =
                  session.createdByMembership?.user.name ??
                  session.createdByMembership?.user.email ??
                  "Unassigned";

                return (
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
                          {session.section.course.code} ·{" "}
                          {session.section.name}
                        </p>
                      </div>
                      <StatusBadge
                        label={formatStatus(session.status)}
                        tone={getSessionTone(session.status)}
                      />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-neutral-500">Start</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {formatDateTime(session.startTime)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Records</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {session._count.attendanceRecords} /{" "}
                          {session.section._count.enrollments}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-neutral-500">Created by</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {creator}
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
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? "No sessions match your search" : "No sessions yet"}
            description={
              query
                ? "Try another search term, or clear the search to view all organization sessions."
                : "Session records will appear here after attendance sessions are created."
            }
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.sessionCreate}
            actionLabel="Create session"
          />
        )}
      </SectionCard>
    </>
  );
}
