import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  KeyRound,
  ListChecks,
  MapPin,
  QrCode,
  UserRound,
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
import { getAdminSessionDetailData } from "@/lib/admin/queries";

type AdminSessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatDuration(startTime: Date, endTime: Date) {
  const minutes = Math.max(
    0,
    Math.round((endTime.getTime() - startTime.getTime()) / 60000),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

function formatPerson(
  user:
    | {
        name: string | null;
        email: string;
      }
    | null
    | undefined,
) {
  if (!user) {
    return "Unassigned";
  }

  return user.name ? `${user.name} · ${user.email}` : user.email;
}

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
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

function DetailList({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="text-sm font-medium text-neutral-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminSessionDetailPage({
  params,
}: AdminSessionDetailPageProps) {
  const { sessionId } = await params;
  const authContext = await requireAdminAuthContext();
  const data = await getAdminSessionDetailData(authContext, sessionId);

  if (!data) {
    notFound();
  }

  const { session } = data;
  const latestQrToken = data.latestQrToken;
  const instructor = formatPerson(session.section.instructorMembership?.user);
  const creator = formatPerson(session.createdByMembership?.user);
  const attendanceRate =
    data.attendanceRate === null ? "--" : `${data.attendanceRate}%`;

  const overviewItems = [
    { label: "Description", value: session.description ?? "No description" },
    { label: "Created by", value: creator },
    { label: "Created", value: formatDateTime(session.createdAt) },
    { label: "Updated", value: formatDateTime(session.updatedAt) },
    {
      label: "Late threshold",
      value: `${session.lateThresholdMinutes} minutes`,
    },
  ];

  const scheduleItems = [
    { label: "Starts", value: formatDateTime(session.startTime) },
    { label: "Ends", value: formatDateTime(session.endTime) },
    {
      label: "Duration",
      value: formatDuration(session.startTime, session.endTime),
    },
    { label: "Status", value: formatEnum(session.status) },
  ];

  const sectionItems = [
    {
      label: "Course",
      value: `${session.section.course.code} · ${session.section.course.title}`,
    },
    {
      label: "Section",
      value: session.section.code
        ? `${session.section.code} · ${session.section.name}`
        : session.section.name,
    },
    { label: "Instructor", value: instructor },
    {
      label: "Enrolled",
      value: String(session.section._count.enrollments),
    },
    {
      label: "Section status",
      value: session.section.isActive ? "Active" : "Inactive",
    },
  ];

  const roomItems = session.room
    ? [
        {
          label: "Room",
          value: session.room.code
            ? `${session.room.code} · ${session.room.name}`
            : session.room.name,
        },
        { label: "Description", value: session.room.description ?? "None" },
        { label: "Address", value: session.room.address ?? "Not set" },
        {
          label: "Allowed radius",
          value:
            session.room.allowedRadiusMeters === null
              ? "Not set"
              : `${session.room.allowedRadiusMeters} meters`,
        },
        {
          label: "Geolocation",
          value:
            session.room.latitude && session.room.longitude
              ? `${session.room.latitude.toString()}, ${session.room.longitude.toString()}`
              : "Not set",
        },
      ]
    : [];

  const qrTokenItems = latestQrToken
    ? [
        { label: "Latest token", value: latestQrToken.id },
        { label: "Created", value: formatDateTime(latestQrToken.createdAt) },
        { label: "Expires", value: formatDateTime(latestQrToken.expiresAt) },
        {
          label: "Revoked",
          value: latestQrToken.revokedAt
            ? formatDateTime(latestQrToken.revokedAt)
            : "No",
        },
      ]
    : [];

  const summaryStats = [
    {
      label: "Attendance records",
      value: String(session._count.attendanceRecords),
      trend: "Stored",
      description: "Records captured for this attendance session.",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Attended",
      value: String(data.attendedRecords),
      trend: "Present/late/manual",
      description: "Read-only count of attendance-positive statuses.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
    {
      label: "Attendance rate",
      value: attendanceRate,
      trend: data.attendanceRate === null ? "No records" : "Recorded",
      description: "Positive attendance records over total records.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "QR tokens",
      value: String(session._count.qrTokens),
      trend: latestQrToken ? "Latest loaded" : "None yet",
      description: "Token history count without exposing token values.",
      icon: <QrCode className="h-4 w-4" aria-hidden="true" />,
      tone: "warning" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title={session.title}
        description={`${session.section.course.code} · ${session.section.name}`}
      >
        <ButtonLink
          href={routes.admin.sessions}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Back
        </ButtonLink>
        <StatusBadge
          label={formatEnum(session.status)}
          tone={getSessionTone(session.status)}
        />
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Overview"
          description="Core read-only metadata for this attendance session."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={overviewItems} />
        </SectionCard>

        <SectionCard
          title="Schedule"
          description="Timing details used by attendance and late policies."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={scheduleItems} />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Course and section"
          description="Academic or training context attached to this session."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={sectionItems} />
        </SectionCard>

        <SectionCard
          title="Room and location"
          description="Physical location metadata for room-aware attendance."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          {session.room ? (
            <DetailList items={roomItems} />
          ) : (
            <EmptyState
              title="No room assigned"
              description="Room and geolocation details will appear here when the session is tied to a room."
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
        <SectionCard
          title="QR token summary"
          description="Read-only token history metadata. Token values are never displayed."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          {latestQrToken ? (
            <DetailList items={qrTokenItems} />
          ) : (
            <EmptyState
              title="No QR tokens recorded"
              description="Generated QR token metadata will appear here after QR lifecycle work is implemented."
              icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Attendance summary"
          description="Stored attendance records grouped by status."
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
              description="Attendance status counts will appear after records exist for this session."
              icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Recent attendance records"
        description="Latest stored records for this session, shown without mutation controls."
      >
        {session.attendanceRecords.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Checked in</th>
                    <th className="px-4 py-3">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {session.attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {record.studentUser.name ?? "Unnamed user"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {record.studentUser.email}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatEnum(record.status)}
                          tone={getAttendanceTone(record.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatEnum(record.source)}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {record.checkedInAt
                          ? formatDateTime(record.checkedInAt)
                          : "Not checked in"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {record.locationAccuracyMeters === null
                          ? "Not set"
                          : `${record.locationAccuracyMeters} m`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {session.attendanceRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-950">
                        {record.studentUser.name ?? "Unnamed user"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {record.studentUser.email}
                      </p>
                    </div>
                    <StatusBadge
                      label={formatEnum(record.status)}
                      tone={getAttendanceTone(record.status)}
                    />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">Source</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatEnum(record.source)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Checked in</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {record.checkedInAt
                          ? formatDateTime(record.checkedInAt)
                          : "Not checked in"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No attendance records"
            description="Recent attendance records will appear here after this session has stored attendance data."
            icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
