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

const overviewStats = [
  {
    label: "Active sessions",
    value: "3",
    trend: "Today",
    description: "Live or scheduled check-ins prepared for the day.",
    icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
    tone: "info" as const,
  },
  {
    label: "Attendance rate",
    value: "91%",
    trend: "Mock",
    description: "Placeholder average for completed sessions.",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    tone: "success" as const,
  },
  {
    label: "Members",
    value: "128",
    trend: "Demo",
    description: "Seed-ready count for admins, instructors, and students.",
    icon: <Users className="h-4 w-4" aria-hidden="true" />,
    tone: "neutral" as const,
  },
  {
    label: "Needs review",
    value: "5",
    trend: "Open",
    description: "Attendance exceptions awaiting admin review.",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
    tone: "warning" as const,
  },
];

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

const upcomingSessions = [
  {
    title: "Data Structures Lab",
    section: "CS-204 A",
    time: "09:30",
    room: "Engineering 204",
    status: "Scheduled",
  },
  {
    title: "Corporate Onboarding",
    section: "May Cohort",
    time: "13:00",
    room: "Training Room 2",
    status: "Ready",
  },
  {
    title: "Product Analytics",
    section: "Evening Academy",
    time: "18:00",
    room: "Remote",
    status: "Draft",
  },
];

const recentActivity = [
  "Instructor role assigned to a demo member",
  "Attendance report placeholder generated",
  "Session draft created for CS-204 A",
];

const platformStatus = [
  { label: "Auth boundary", status: "Ready", tone: "success" as const },
  { label: "Prisma schema", status: "Ready", tone: "success" as const },
  { label: "QR flow", status: "Planned", tone: "warning" as const },
  { label: "Reports engine", status: "Planned", tone: "warning" as const },
];

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin workspace"
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
          description="Prepared session list placeholder for the next operating window."
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
          <div className="divide-y divide-neutral-100">
            {upcomingSessions.map((session) => (
              <div
                key={`${session.title}-${session.time}`}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_110px_150px_100px] md:items-center"
              >
                <div>
                  <p className="font-medium text-neutral-950">
                    {session.title}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {session.section}
                  </p>
                </div>
                <p className="text-sm text-neutral-600">{session.time}</p>
                <p className="text-sm text-neutral-600">{session.room}</p>
                <StatusBadge
                  label={session.status}
                  tone={session.status === "Ready" ? "success" : "info"}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Attention needed"
          description="Review queue placeholder for future operational exceptions."
        >
          <EmptyState
            title="5 records need review"
            description="Manual corrections, rejected scans, and late exceptions will appear here once attendance workflows are connected."
            icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.reports}
            actionLabel="Open reports"
          />
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
          description="Audit-log backed activity will land here later."
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item} className="flex gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item}</p>
                  <p className="mt-1 text-xs text-neutral-500">Demo event</p>
                </div>
              </div>
            ))}
          </div>
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
