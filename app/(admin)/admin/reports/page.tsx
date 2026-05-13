import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  ListChecks,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminReportsData } from "@/lib/admin/queries";

const reportCards = [
  {
    title: "Attendance summary",
    description: "Session-level present, late, absent, and excused totals.",
    status: "Ready for data",
    icon: <FileBarChart className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Participation trends",
    description: "Longitudinal participation by course, section, and cohort.",
    status: "Planned",
    icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Export package",
    description: "CSV-friendly records for academic or training operations.",
    status: "Planned",
    icon: <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />,
  },
];

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function getRoleTone(role: string) {
  if (role === "ORG_ADMIN" || role === "SUPER_ADMIN") return "info" as const;
  if (role === "INSTRUCTOR") return "success" as const;
  return "neutral" as const;
}

function getAttendanceTone(status: string) {
  if (status === "PRESENT" || status === "LATE" || status === "MANUAL") {
    return "success" as const;
  }

  if (status === "ABSENT" || status === "REJECTED") {
    return "danger" as const;
  }

  return "info" as const;
}

function getPercent(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export default async function AdminReportsPage() {
  const authContext = await requireAdminAuthContext();
  const data = await getAdminReportsData(authContext);

  const summaryStats = [
    {
      label: "Total sessions",
      value: String(data.totalSessions),
      trend: "All time",
      description: "Attendance sessions in the active organization.",
      icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Completed sessions",
      value: String(data.completedSessions),
      trend: "Closed",
      description: "Sessions that have moved into a completed state.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
    {
      label: "Members",
      value: String(data.totalMembers),
      trend: "Tenant scoped",
      description: "Membership records available for reports.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Attendance records",
      value: String(data.attendanceRecords),
      trend: data.attendanceRecords > 0 ? "Recorded" : "None yet",
      description: "Raw attendance records available for aggregation.",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      tone: "warning" as const,
    },
  ];

  const maxMembershipCount = Math.max(
    ...data.membershipCounts.map((item) => item._count._all),
    1,
  );

  return (
    <>
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        description="Read-only aggregate summaries for attendance outcomes, members, and export-ready reporting."
      >
        <StatusBadge label="Read only" tone="info" />
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Session outcomes"
          description="Current session lifecycle counts from organization-scoped records."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Upcoming",
                value: data.upcomingSessions,
                tone: "info" as const,
              },
              {
                label: "Completed",
                value: data.completedSessions,
                tone: "success" as const,
              },
              {
                label: "Cancelled",
                value: data.cancelledSessions,
                tone: "danger" as const,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <StatusBadge label={item.label} tone={item.tone} />
                <p className="mt-4 text-3xl font-semibold text-neutral-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Export queue"
          description="Reports generated by background jobs will be tracked here later."
        >
          <EmptyState
            title="No exports generated"
            description="CSV and PDF export jobs will appear here once report generation is connected."
            icon={<Download className="h-5 w-5" aria-hidden="true" />}
          />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Role distribution"
          description="Membership counts by role in the active organization."
        >
          {data.membershipCounts.length > 0 ? (
            <div className="space-y-4">
              {data.membershipCounts.map((item) => {
                const count = item._count._all;
                const width = getPercent(count, maxMembershipCount);

                return (
                  <div key={item.role}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <StatusBadge
                        label={formatEnum(item.role)}
                        tone={getRoleTone(item.role)}
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-neutral-900"
                        style={{ width: `${Math.max(width, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No members to report"
              description="Role distribution will appear when organization memberships exist."
              icon={<Users className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Attendance records by status"
          description="Counts from stored attendance records, grouped by status."
        >
          {data.attendanceStatusCounts.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.attendanceStatusCounts.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <StatusBadge
                    label={formatEnum(item.status)}
                    tone={getAttendanceTone(item.status)}
                  />
                  <span className="text-sm font-semibold text-neutral-950">
                    {item._count._all}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No attendance records"
              description="Attendance status summaries will appear after check-in or manual record data exists."
              icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Report library"
        description="Reusable report surfaces prepared for future data sources."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {reportCards.map((report) => (
            <div
              key={report.title}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-neutral-600 shadow-subtle">
                  {report.icon}
                </div>
                <StatusBadge
                  label={report.status}
                  tone={report.status === "Ready for data" ? "info" : "warning"}
                />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-950">
                {report.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {report.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Report filters"
        description="Date range, course, section, and status filters are reserved for the report generation workflow."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Date range", "Course", "Section", "Attendance status"].map(
            (filter) => (
              <div
                key={filter}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
              >
                <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
                  {filter}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  Planned
                </p>
              </div>
            ),
          )}
        </div>
      </SectionCard>
    </>
  );
}
