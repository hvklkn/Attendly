import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileBarChart,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/queries";

const quickActions = [
  {
    title: "Create session",
    description: "Prepare an attendance window for a section.",
    href: routes.admin.sessionCreate,
    icon: <CalendarPlus className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Invite users",
    description: "Stage admins, instructors, or students.",
    href: routes.admin.users,
    icon: <UserPlus className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "View reports",
    description: "Review participation summaries.",
    href: routes.admin.reports,
    icon: <FileBarChart className="h-4 w-4" aria-hidden="true" />,
  },
];

const platformStatus = [
  { label: "Auth boundary", status: "Ready", tone: "success" as const },
  { label: "Prisma schema", status: "Ready", tone: "success" as const },
  { label: "QR flow", status: "Planned", tone: "warning" as const },
  { label: "Reports engine", status: "Planned", tone: "warning" as const },
];

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

export default async function AdminDashboardPage() {
  const authContext = await requireAdminAuthContext();
  const data = await getAdminDashboardData(authContext);

  const overviewStats = [
    {
      label: "Total sessions",
      value: String(data.totalSessions),
      trend: "All time",
      description: "Attendance sessions scoped to this organization.",
      icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Upcoming sessions",
      value: String(data.upcomingSessionsCount),
      trend: "Scheduled",
      description: "Future sessions not yet closed or cancelled.",
      icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Members",
      value: String(data.totalMembers),
      trend: "Active tenant",
      description: "Membership records in the current organization.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Attendance rate",
      value: data.attendanceRate === null ? "--" : `${data.attendanceRate}%`,
      trend: data.totalAttendanceRecords > 0 ? "Recorded" : "No records",
      description: "Present, late, and manual records over total records.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Dashboard"
        description="Operational overview for sessions, people, reports, and workspace readiness."
      >
        <ButtonLink
          href={routes.admin.sessionCreate}
          variant="primary"
          icon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Create session
        </ButtonLink>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard
          title="Upcoming sessions"
          description="Next scheduled sessions for the active organization."
          actions={
            <ButtonLink
              href={routes.admin.sessions}
              variant="ghost"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              View all
            </ButtonLink>
          }
        >
          {data.upcomingSessions.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_170px_150px_120px] md:items-center"
                >
                  <div>
                    <p className="font-medium text-neutral-950">
                      {session.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {session.section.course.code} · {session.section.name}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {formatDateTime(session.startTime)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {session.room?.name ?? "No room"}
                  </p>
                  <StatusBadge
                    label={formatStatus(session.status)}
                    tone={getSessionTone(session.status)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming sessions"
              description="Future attendance sessions will appear here after they are created."
              icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
              actionHref={routes.admin.sessionCreate}
              actionLabel="Create session"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Attention needed"
          description="Read-only review queue based on attendance records."
        >
          {data.needsReviewCount > 0 ? (
            <EmptyState
              title={`${data.needsReviewCount} records need review`}
              description="Rejected and manual attendance records are counted here for future review workflows."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              actionHref={routes.admin.reports}
              actionLabel="Open reports"
            />
          ) : (
            <EmptyState
              title="No records need review"
              description="Rejected and manual attendance records will appear here when they exist."
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Quick actions"
          description="Common administrative entry points."
          className="lg:col-span-1"
        >
          <div className="divide-y divide-neutral-100">
            {quickActions.map((action) => (
              <ButtonLink
                key={action.title}
                href={action.href}
                variant="ghost"
                icon={action.icon}
                className="h-auto w-full justify-start rounded-none border-0 px-0 py-4 first:pt-0 last:pb-0"
              >
                <span className="text-left">
                  <span className="block font-medium">{action.title}</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">
                    {action.description}
                  </span>
                </span>
              </ButtonLink>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="Latest audit log entries scoped to this organization."
          className="lg:col-span-1"
        >
          {data.recentAuditLogs.length > 0 ? (
            <div className="space-y-4">
              {data.recentAuditLogs.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {item.action}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.targetType}
                      {item.targetId ? ` · ${item.targetId}` : ""} ·{" "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : data.recentSessions.length > 0 ? (
            <div className="space-y-4">
              {data.recentSessions.map((session) => (
                <div key={session.id} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {session.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {session.section.course.code} · {session.section.name} ·{" "}
                      {formatDateTime(session.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No activity yet"
              description="Audit log events will appear here after admin actions are recorded."
              icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="System status"
          description="Implementation readiness across core foundations."
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            {platformStatus.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    {item.tone === "success" ? (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    {item.label}
                  </p>
                </div>
                <StatusBadge label={item.status} tone={item.tone} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </>
  );
}
