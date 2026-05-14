import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
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
import {
  formatDateTimeTr,
  getAttendanceSessionGeofenceSourceLabel,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionStatusLabel,
  getAttendanceSourceLabel,
} from "@/lib/localization";
import { AdminSessionQrTokenPanel } from "./AdminSessionQrTokenPanel";

type AdminSessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    created?: string | string[];
  }>;
};

function formatDateTime(date: Date) {
  return formatDateTimeTr(date);
}

function formatEnum(value: string) {
  if (
    value === "PRESENT" ||
    value === "LATE" ||
    value === "ABSENT" ||
    value === "EXCUSED" ||
    value === "REJECTED" ||
    value === "MANUAL"
  ) {
    return getAttendanceRecordStatusLabel(value);
  }

  if (
    value === "QR_SCAN" ||
    value === "MANUAL_ENTRY" ||
    value === "SYSTEM_GENERATED"
  ) {
    return getAttendanceSourceLabel(value);
  }

  return getAttendanceSessionStatusLabel(value);
}

function formatDuration(startTime: Date, endTime: Date) {
  const minutes = Math.max(
    0,
    Math.round((endTime.getTime() - startTime.getTime()) / 60000),
  );

  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} sa ${remainingMinutes} dk`
    : `${hours} sa`;
}

function formatMeters(value: number | null | undefined) {
  return typeof value === "number" ? `${value} metre` : "Belirtilmedi";
}

function formatDecimalMeters(
  value: { toString: () => string } | number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "Belirtilmedi";
  }

  return `${Number(value.toString()).toFixed(0)} metre`;
}

function formatCoordinates(
  latitude: { toString: () => string } | null,
  longitude: { toString: () => string } | null,
) {
  if (!latitude || !longitude) {
    return "Belirtilmedi";
  }

  return `${latitude.toString()}, ${longitude.toString()}`;
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
    return "Atanmadı";
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
  searchParams,
}: AdminSessionDetailPageProps) {
  const [{ sessionId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const authContext = await requireAdminAuthContext();
  const data = await getAdminSessionDetailData(authContext, sessionId);

  if (!data) {
    notFound();
  }

  const { session } = data;
  const latestQrToken = data.latestQrToken;
  const instructor = formatPerson(session.section.instructorMembership?.user);
  const creator = formatPerson(session.createdByMembership?.user);
  const created =
    (Array.isArray(resolvedSearchParams?.created)
      ? resolvedSearchParams?.created[0]
      : resolvedSearchParams?.created) === "1";
  const attendanceRate =
    data.attendanceRate === null ? "--" : `${data.attendanceRate}%`;

  const overviewItems = [
    { label: "Açıklama", value: session.description ?? "Açıklama yok" },
    { label: "Oluşturan", value: creator },
    { label: "Oluşturuldu", value: formatDateTime(session.createdAt) },
    { label: "Güncellendi", value: formatDateTime(session.updatedAt) },
    {
      label: "Geç kalma eşiği",
      value: `${session.lateThresholdMinutes} dakika`,
    },
  ];

  const scheduleItems = [
    { label: "Başlangıç", value: formatDateTime(session.startTime) },
    { label: "Bitiş", value: formatDateTime(session.endTime) },
    {
      label: "Süre",
      value: formatDuration(session.startTime, session.endTime),
    },
    { label: "Durum", value: formatEnum(session.status) },
  ];

  const sectionItems = [
    {
      label: "Ders",
      value: `${session.section.course.code} · ${session.section.course.title}`,
    },
    {
      label: "Ders Grubu",
      value: session.section.code
        ? `${session.section.code} · ${session.section.name}`
        : session.section.name,
    },
    { label: "Öğretmen", value: instructor },
    {
      label: "Kayıtlı Öğrenci",
      value: String(session.section._count.enrollments),
    },
    {
      label: "Ders Grubu Durumu",
      value: session.section.isActive ? "Aktif" : "Pasif",
    },
  ];

  const roomItems = session.room
    ? [
        {
          label: "Oda",
          value: session.room.code
            ? `${session.room.code} · ${session.room.name}`
            : session.room.name,
        },
        { label: "Açıklama", value: session.room.description ?? "Yok" },
        { label: "Adres", value: session.room.address ?? "Belirtilmedi" },
        {
          label: "İzin verilen yarıçap",
          value:
            session.room.allowedRadiusMeters === null
              ? "Belirtilmedi"
              : `${session.room.allowedRadiusMeters} metre`,
        },
        {
          label: "Konum",
          value:
            session.room.latitude && session.room.longitude
              ? `${session.room.latitude.toString()}, ${session.room.longitude.toString()}`
              : "Belirtilmedi",
        },
      ]
    : [];
  const hasGeofence =
    session.geofenceLatitude !== null &&
    session.geofenceLongitude !== null &&
    session.geofenceRadiusMeters !== null;
  const geofenceItems = hasGeofence
    ? [
        { label: "Yoklama Alanı", value: "Tanımlı" },
        {
          label: "Merkez Konum",
          value: formatCoordinates(
            session.geofenceLatitude,
            session.geofenceLongitude,
          ),
        },
        {
          label: "Yarıçap",
          value: formatMeters(session.geofenceRadiusMeters),
        },
        {
          label: "Konum Kaynağı",
          value: getAttendanceSessionGeofenceSourceLabel(
            session.geofenceSource,
          ),
        },
        {
          label: "Konum Doğruluğu",
          value: formatDecimalMeters(session.geofenceAccuracyMeters),
        },
        {
          label: "Konum Alındı",
          value: session.geofenceCapturedAt
            ? formatDateTime(session.geofenceCapturedAt)
            : "Belirtilmedi",
        },
      ]
    : [];

  const summaryStats = [
    {
      label: "Yoklama Kayıtları",
      value: String(session._count.attendanceRecords),
      trend: "Kayıtlı",
      description: "Bu yoklama oturumu için saklanan kayıtlar.",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Katılan",
      value: String(data.attendedRecords),
      trend: "Katıldı/geç/manuel",
      description: "Olumlu sayılan yoklama durumlarının toplamı.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
    {
      label: "Katılım Oranı",
      value: attendanceRate,
      trend: data.attendanceRate === null ? "Kayıt yok" : "Kayıtlı",
      description: "Olumlu yoklama kayıtlarının toplam kayıtlara oranı.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "QR Anahtarları",
      value: String(session._count.qrTokens),
      trend: latestQrToken ? "Son QR yüklendi" : "Henüz yok",
      description: "Ham değerler gösterilmeden QR geçmişi sayısı.",
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
          Geri
        </ButtonLink>
        <StatusBadge
          label={formatEnum(session.status)}
          tone={getSessionTone(session.status)}
        />
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Yoklama oturumu oluşturuldu.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard
          title="Genel Bakış"
          description="Bu yoklama oturumu için temel salt okunur bilgiler."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={overviewItems} />
        </SectionCard>

        <SectionCard
          title="Takvim"
          description="Yoklama ve geç kalma kuralları için zaman bilgileri."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={scheduleItems} />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Ders ve Ders Grubu"
          description="Bu oturuma bağlı akademik veya eğitim bağlamı."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={sectionItems} />
        </SectionCard>

        <SectionCard
          title="Oda ve Konum"
          description="Konum duyarlı yoklama için fiziksel konum bilgileri."
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
              title="Oda atanmadı"
              description="Oturum bir odaya bağlandığında oda ve konum bilgileri burada görünecek."
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Konum Doğrulama"
          description="Öğrenci konumu daha sonra bu yoklama alanıyla karşılaştırılacak."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          {hasGeofence ? (
            <DetailList items={geofenceItems} />
          ) : (
            <EmptyState
              title="Konum doğrulaması tanımlı değil"
              description="Bu oturumda öğrenci konumu için yoklama alanı henüz saklanmamış."
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
        <AdminSessionQrTokenPanel
          sessionId={session.id}
          sessionStatus={session.status}
          latestToken={
            latestQrToken
              ? {
                  id: latestQrToken.id,
                  createdAt: latestQrToken.createdAt.toISOString(),
                  expiresAt: latestQrToken.expiresAt.toISOString(),
                  revokedAt: latestQrToken.revokedAt?.toISOString() ?? null,
                }
              : null
          }
        />

        <SectionCard
          title="Yoklama Özeti"
          description="Duruma göre gruplanmış kayıtlı yoklama verileri."
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
              title="Yoklama kaydı yok"
              description="Bu oturum için kayıtlar oluştuğunda durum sayıları burada görünecek."
              icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Şüpheli Katılım Kayıtları"
        description="Kapıdan okutma, ders ortasında ayrılma veya ara kontrol kaçırma gibi durumlar burada incelenecek."
        actions={
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </div>
        }
      >
        <EmptyState
          title="İncelenmesi gereken kayıt yok"
          description="Devamlılık uyarıları üretildiğinde kurum yöneticileri bu alandan takip edecek."
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          className="min-h-40"
        />
      </SectionCard>

      <SectionCard
        title="Son Yoklama Kayıtları"
        description="Bu oturum için son kayıtlar; değişiklik kontrolü olmadan gösterilir."
      >
        {session.attendanceRecords.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Öğrenci</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Kaynak</th>
                    <th className="px-4 py-3">Katılım</th>
                    <th className="px-4 py-3">Doğruluk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {session.attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {record.studentUser.name ?? "İsimsiz kullanıcı"}
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
                          : "Henüz katılmadı"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {record.locationAccuracyMeters === null
                          ? "Belirtilmedi"
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
                        {record.studentUser.name ?? "İsimsiz kullanıcı"}
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
                      <dt className="text-neutral-500">Kaynak</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatEnum(record.source)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Katılım</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {record.checkedInAt
                          ? formatDateTime(record.checkedInAt)
                          : "Henüz katılmadı"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Yoklama kaydı yok"
            description="Bu oturumda yoklama verisi oluştuğunda son kayıtlar burada görünecek."
            icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
