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
import {
  formatDateTimeTr,
  getOrganizationStatusLabel,
  getRoleLabel,
  getUserStatusLabel,
} from "@/lib/localization";

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
  return formatDateTimeTr(date);
}

function formatEnum(value: string) {
  if (
    value === "SUPER_ADMIN" ||
    value === "ORG_ADMIN" ||
    value === "INSTRUCTOR" ||
    value === "STUDENT"
  ) {
    return getRoleLabel(value);
  }

  if (value === "ACTIVE" || value === "SUSPENDED" || value === "ARCHIVED") {
    return getOrganizationStatusLabel(value);
  }

  return getUserStatusLabel(value);
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
    { label: "Kurum", value: data.organization.name },
    { label: "Kısa ad", value: data.organization.slug },
    { label: "Durum", value: formatEnum(data.organization.status) },
    { label: "Üye Sayısı", value: String(data.memberCount) },
    { label: "Oturum Sayısı", value: String(data.sessionCount) },
  ];

  const attendanceDefaults = [
    { label: "Geç kalma eşiği", value: "Oturum bazında belirlenir" },
    { label: "Varsayılan yarıçap", value: "Oda bazında belirlenir" },
    { label: "QR geçerlilik süresi", value: "60 saniye" },
    { label: "Manuel inceleme", value: "Akış bekliyor" },
  ];

  const securitySettings = [
    { label: "Oturum saklama", value: "Cihaz oturumu" },
    { label: "Şifre özetleme", value: "scrypt" },
    { label: "Aktif cihaz oturumları", value: String(data.activeDeviceSessions) },
    {
      label: "Geçerli oturum bitişi",
      value: formatDateTime(data.deviceSession.expiresAt),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Çalışma alanı yönetimi"
        title="Ayarlar"
        description="Kurum profili, geçerli hesap bağlamı ve oturum güvenliği temelleri."
      >
        <StatusBadge label="Salt okunur" tone="info" />
      </PageHeader>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Kurum"
          description="Aktif çalışma alanı için kurum düzeyi profil bilgileri."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <SettingsList items={organizationSettings} />
        </SectionCard>

        <SectionCard
          title="Hesap Profili"
          description="Giriş temeli tarafından sağlanan geçerli kullanıcı bağlamı."
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
                {data.user.name ?? "İsimsiz kullanıcı"}
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
          title="Yoklama Varsayılanları"
          description="Oturum oluşturma ve yoklama doğrulaması için varsayılan davranışlar."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <SettingsList items={attendanceDefaults} />
        </SectionCard>

        <SectionCard
          title="Güvenlik ve Oturumlar"
          description="Geçerli oturum modeli ve sonraki güvenlik güçlendirme alanları."
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
        title="Yapılandırma Hazırlığı"
        description="Bu ayarlar ileride kalıcı hale getirme ve doğrulama için yapılandırıldı."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <Clock3 className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Zaman bazlı kurallar
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Geç kalma eşikleri ve QR süresi oturum ve QR kayıtlarında
                modellenir.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <KeyRound className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Erişim kontrolleri
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Rol bazlı rota koruması üyelik bağlamı ile çalışır.
              </p>
            </div>
          </div>
          <EmptyState
            title="Özel politika yok"
            description="Kuruma özel politika kayıtları ayarlar kalıcı hale getirildiğinde burada görünecek."
            className="min-h-0 py-6"
          />
        </div>
      </SectionCard>
    </>
  );
}
