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
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorSessionDetailData } from "@/lib/instructor/queries";
import {
  formatDateTimeTr,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionGeofenceSourceLabel,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";
import { InstructorSessionQrTokenPanel } from "./InstructorSessionQrTokenPanel";

type InstructorSessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

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

export default async function InstructorSessionDetailPage({
  params,
}: InstructorSessionDetailPageProps) {
  const { sessionId } = await params;
  const authContext = await requireInstructorAuthContext();
  const data = await getInstructorSessionDetailData(authContext, sessionId);

  if (!data) {
    notFound();
  }

  const { session } = data;
  const latestQrToken = data.latestQrToken;
  const room = session.room
    ? session.room.code
      ? `${session.room.code} - ${session.room.name}`
      : session.room.name
    : "Atanmadı";
  const courseAndSection = session.section.code
    ? `${session.section.course.code} - ${session.section.code} - ${session.section.name}`
    : `${session.section.course.code} - ${session.section.name}`;

  const overviewItems = [
    { label: "Açıklama", value: session.description ?? "Açıklama yok" },
    { label: "Ders ve Şube", value: courseAndSection },
    { label: "Başlangıç", value: formatDateTimeTr(session.startTime) },
    { label: "Bitiş", value: formatDateTimeTr(session.endTime) },
    {
      label: "Süre",
      value: formatDuration(session.startTime, session.endTime),
    },
    {
      label: "Durum",
      value: getAttendanceSessionStatusLabel(session.status),
    },
    {
      label: "Geç Kalma Eşiği",
      value: `${session.lateThresholdMinutes} dakika`,
    },
  ];

  const roomItems = session.room
    ? [
        { label: "Oda", value: room },
        { label: "Açıklama", value: session.room.description ?? "Yok" },
        { label: "Adres", value: session.room.address ?? "Belirtilmedi" },
        {
          label: "Yarıçap",
          value:
            session.room.allowedRadiusMeters === null
              ? "Belirtilmedi"
              : `${session.room.allowedRadiusMeters} metre`,
        },
        {
          label: "Oda Durumu",
          value: session.room.isActive ? "Aktif" : "Pasif",
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
            ? formatDateTimeTr(session.geofenceCapturedAt)
            : "Belirtilmedi",
        },
      ]
    : [];

  const summaryStats = [
    {
      label: "Yoklama Kayıtları",
      value: String(session._count.attendanceRecords),
      trend: "Toplam",
      description: "Bu oturum için kayıtlı yoklama sayısı.",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Katılan",
      value: String(data.attendedRecords),
      trend: "Katıldı/geç/manuel",
      description: "Yoklamada olumlu sayılan kayıtlar.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
    {
      label: "Öğrenci",
      value: String(session.section._count.enrollments),
      trend: "Kayıtlı",
      description: "Bu şubeye kayıtlı öğrenci sayısı.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "QR",
      value: String(session._count.qrTokens),
      trend: latestQrToken ? "Son QR yüklendi" : "Henüz yok",
      description: "Bu oturum için oluşturulan QR geçmişi.",
      icon: <QrCode className="h-4 w-4" aria-hidden="true" />,
      tone: "warning" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Yoklama Oturumu"
        description={session.title}
      >
        <ButtonLink
          href={routes.instructor.sessions}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge
          label={getAttendanceSessionStatusLabel(session.status)}
          tone={getSessionTone(session.status)}
        />
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard
          title="Oturum Bilgileri"
          description="Ders, şube ve zaman bilgileri."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={overviewItems} />
        </SectionCard>

        <InstructorSessionQrTokenPanel
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
        <SectionCard
          title="Oda ve Konum"
          description="Konum doğrulaması sonraki adımda bu bilgilerle genişletilecek."
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
              description="Bu oturum için oda veya konum bilgisi bulunmuyor."
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <div className="grid gap-6">
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

          <SectionCard
            title="Yoklama Özeti"
            description="Kayıtlı yoklama durumlarının dağılımı."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            {data.attendanceStatusCounts.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {data.attendanceStatusCounts.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <StatusBadge
                      label={getAttendanceRecordStatusLabel(item.status)}
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
                title="Henüz yoklama kaydı yok"
                description="Öğrenciler yoklamaya katıldığında durum özeti burada görünecek."
                icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            )}
          </SectionCard>

          <SectionCard
            title="Canlı Uyarılar"
            description="Öğrenciler ara kontrolde doğrulanmadığında veya yoklama alanı dışına çıktığında burada görünür."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <EmptyState
              title="Henüz uyarı yok"
              description="Devamlılık kontrolü ve uyarı üretimi sonraki adımda bağlanacak."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          </SectionCard>
        </div>
      </section>

      <SectionCard
        title="Son Yoklama Kayıtları"
        description="Bu adımda yalnızca okuma görünümü bulunur."
      >
        {session.attendanceRecords.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {session.attendanceRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-neutral-950">
                    {record.studentUser.name ?? "İsimsiz öğrenci"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {record.studentUser.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    label={getAttendanceRecordStatusLabel(record.status)}
                    tone={getAttendanceTone(record.status)}
                  />
                  <span className="text-sm text-neutral-500">
                    {record.checkedInAt
                      ? formatDateTimeTr(record.checkedInAt)
                      : "Henüz katılmadı"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Henüz yoklama kaydı yok"
            description="Öğrenci yoklama katılım akışı eklendiğinde son kayıtlar burada listelenecek."
            icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
