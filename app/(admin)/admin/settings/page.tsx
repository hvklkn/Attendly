import {
  Building2,
  Clock3,
  KeyRound,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const organizationSettings = [
  { label: "Organization", value: "Attendly Demo University" },
  { label: "Slug", value: "demo-university" },
  { label: "Default timezone", value: "Europe/Istanbul" },
  { label: "Status", value: "Active" },
];

const attendanceDefaults = [
  { label: "Late threshold", value: "10 minutes" },
  { label: "Default radius", value: "50 meters" },
  { label: "QR token expiry", value: "2 minutes" },
  { label: "Manual review", value: "Enabled" },
];

const securitySettings = [
  { label: "Session duration", value: "7 days" },
  { label: "Session storage", value: "DeviceSession" },
  { label: "Password hashing", value: "scrypt" },
  { label: "Audit logging", value: "Planned" },
];

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

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace administration"
        title="Settings"
        description="Organize tenant profile, attendance defaults, account information, and session security foundations."
      >
        <ButtonLink
          href="/admin/settings"
          variant="primary"
          icon={<Save className="h-4 w-4" aria-hidden="true" />}
        >
          Save changes
        </ButtonLink>
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
              AD
            </div>
            <div>
              <p className="font-semibold text-neutral-950">Admin user</p>
              <p className="mt-1 text-sm text-neutral-500">
                Profile values will come from the authenticated user context.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label="ORG ADMIN" tone="info" />
                <StatusBadge label="Active" tone="success" />
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
          description="Current session model choices and future hardening areas."
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
                Late thresholds and QR expiry are ready for real settings.
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
                Role-aware route protection is already in place.
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
