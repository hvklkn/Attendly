import {
  Building2,
  Clock3,
  KeyRound,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminSettingsData } from "@/lib/admin/queries";

function SettingsList({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:items-center"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="text-sm font-medium text-neutral-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

export default async function AdminSettingsPage() {
  const authContext = await requireAdminAuthContext();
  const data = await getAdminSettingsData(authContext);

  const organizationSettings = [
    { label: "Organization", value: data.organization.name },
    { label: "Slug", value: data.organization.slug },
    { label: "Status", value: formatEnum(data.organization.status) },
    { label: "Members", value: String(data.memberCount) },
    { label: "Sessions", value: String(data.sessionCount) },
  ];

  const attendanceDefaults = [
    { label: "Late threshold", value: "Configured per session" },
    { label: "Default radius", value: "Configured per room" },
    { label: "QR token expiry", value: "Configured per token" },
    { label: "Manual review", value: "Pending workflow" },
  ];

  const securitySettings = [
    { label: "Session storage", value: "DeviceSession" },
    { label: "Password hashing", value: "scrypt" },
    { label: "Active device sessions", value: String(data.activeDeviceSessions) },
    {
      label: "Current session expires",
      value: formatDateTime(data.deviceSession.expiresAt),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Workspace administration"
        title="Settings"
        description="Read-only tenant profile, current account context, and session security foundations."
      >
        <StatusBadge label="Read only" tone="info" />
      </PageHeader>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Organization"
          description="Tenant-level profile details for the active workspace."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <SettingsList items={organizationSettings} />
        </SectionCard>

        <SectionCard
          title="Account profile"
          description="Current user context surfaced by the auth foundation."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">
              {getInitials(data.user.name, data.user.email)}
            </div>
            <div>
              <p className="font-semibold text-neutral-950">
                {data.user.name ?? "Unnamed user"}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {data.user.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label={formatEnum(data.role)} tone="info" />
                <StatusBadge
                  label={formatEnum(data.user.status)}
                  tone={getStatusTone(data.user.status)}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Attendance defaults"
          description="Default behavior for future session creation and check-in validation."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <SettingsList items={attendanceDefaults} />
        </SectionCard>

        <SectionCard
          title="Security and sessions"
          description="Current session model values and future hardening areas."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <SettingsList items={securitySettings} />
        </SectionCard>
      </section>

      <SectionCard
        title="Configuration readiness"
        description="These settings are structured for later persistence and validation."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <Clock3 className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Time-based rules
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Late thresholds and QR expiry are modeled on session and token
                records.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <KeyRound className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Access controls
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Role-aware route protection is already backed by membership
                context.
              </p>
            </div>
          </div>
          <EmptyState
            title="No custom policies"
            description="Tenant-specific policy records will appear here after settings persistence is added."
            className="min-h-0 py-6"
          />
        </div>
      </SectionCard>
    </>
  );
}
