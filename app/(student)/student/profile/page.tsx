import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChangePasswordForm } from "@/components/password/ChangePasswordForm";
import { requireRole } from "@/lib/auth/guards";
import {
  formatDateTimeTr,
  getRoleLabel,
  getUserStatusLabel,
} from "@/lib/localization";

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
          className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="text-sm font-medium text-neutral-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function StudentProfilePage() {
  const authContext = await requireRole("STUDENT");
  const items = [
    {
      label: "Ad Soyad",
      value: authContext.user.name ?? "Belirtilmedi",
    },
    {
      label: "E-posta",
      value: authContext.user.email,
    },
    {
      label: "Rol",
      value: getRoleLabel(authContext.role),
    },
    {
      label: "Kurum",
      value: authContext.activeOrganization.name,
    },
    {
      label: "Oturum bitişi",
      value: formatDateTimeTr(authContext.deviceSession.expiresAt),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Profil"
        description="Öğrenci hesabınız ve kurum üyeliğiniz."
      >
        <StatusBadge
          label={getUserStatusLabel(authContext.user.status)}
          tone={authContext.user.status === "ACTIVE" ? "success" : "neutral"}
        />
      </PageHeader>

      <SectionCard
        title="Profil Bilgileri"
        description="Yoklama akışında kullanılan temel öğrenci bilgileri."
      >
        <DetailList items={items} />
      </SectionCard>

      <ChangePasswordForm
        mustChangePassword={authContext.user.mustChangePassword}
      />
    </>
  );
}
