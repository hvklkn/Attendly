import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPin,
  PlayCircle,
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
import { startInstructorSessionAction } from "@/lib/instructor/session-actions";
import { getInstructorSessionDetailData } from "@/lib/instructor/queries";
import {
  formatDateTimeTr,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionStatusLabel,
  getPresenceCheckStatusLabel,
} from "@/lib/localization";
import { InstructorSessionQrTokenPanel } from "./InstructorSessionQrTokenPanel";

type InstructorSessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    started?: string | string[];
    startError?: string | string[];
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

function getPresenceCheckTone(status: string | null | undefined) {
  if (status === "INSIDE_GEOFENCE" || status === "VERIFIED") {
    return "success" as const;
  }

  if (status === "OUTSIDE_GEOFENCE" || status === "SUSPICIOUS") {
    return "danger" as const;
  }

  if (status === "LOCATION_UNAVAILABLE" || status === "QR_NOT_CONFIRMED") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getLocationVerificationLabel(
  status: string | null | undefined,
  recordStatus: string,
) {
  if (status) {
    return getPresenceCheckStatusLabel(status);
  }

  return recordStatus === "REJECTED" ? "Konum dışı" : "Konum içi";
}

function getLocationVerificationTone(
  status: string | null | undefined,
  recordStatus: string,
) {
  if (status) {
    return getPresenceCheckTone(status);
  }

  return recordStatus === "REJECTED" ? "danger" : "success";
}

function getGeofenceDisplaySource(source: string, hasSessionGeofence: boolean) {
  if (!hasSessionGeofence || source === "ROOM") {
    return "Oda konumu";
  }

  return "Oturum konumu";
}

function getGeofenceDescription(source: string, hasSessionGeofence: boolean) {
  if (!hasSessionGeofence) {
    return "Bu oturumda kayıtlı geofence yok; oda konumu kullanılacak.";
  }

  if (source === "DEVICE") {
    return "Bu oturum eğitmen konumu ile oluşturuldu.";
  }

  if (source === "ROOM") {
    return "Bu oturum oda konumu ile oluşturuldu.";
  }

  return "Bu oturum için kaydedilmiş konum kullanılacak.";
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
  searchParams,
}: InstructorSessionDetailPageProps) {
  const [{ sessionId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const authContext = await requireInstructorAuthContext();
  const data = await getInstructorSessionDetailData(authContext, sessionId);

  if (!data) {
    notFound();
  }

  const { session } = data;
  const latestQrToken = data.latestQrToken;
  const started =
    (Array.isArray(resolvedSearchParams?.started)
      ? resolvedSearchParams?.started[0]
      : resolvedSearchParams?.started) === "1";
  const startError =
    (Array.isArray(resolvedSearchParams?.startError)
      ? resolvedSearchParams?.startError[0]
      : resolvedSearchParams?.startError) === "1";
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
  const hasSessionGeofence =
    session.geofenceLatitude !== null &&
    session.geofenceLongitude !== null &&
    session.geofenceRadiusMeters !== null;
  const hasRoomGeofence =
    session.room?.latitude !== null &&
    session.room?.latitude !== undefined &&
    session.room.longitude !== null &&
    session.room.longitude !== undefined &&
    session.room.allowedRadiusMeters !== null;
  const displayedGeofence = hasSessionGeofence
    ? {
        latitude: session.geofenceLatitude,
        longitude: session.geofenceLongitude,
        radiusMeters: session.geofenceRadiusMeters,
        accuracyMeters: session.geofenceAccuracyMeters,
        capturedAt: session.geofenceCapturedAt,
        source: getGeofenceDisplaySource(session.geofenceSource, true),
        description: getGeofenceDescription(session.geofenceSource, true),
      }
    : hasRoomGeofence && session.room
      ? {
          latitude: session.room.latitude,
          longitude: session.room.longitude,
          radiusMeters: session.room.allowedRadiusMeters,
          accuracyMeters: null,
          capturedAt: null,
          source: getGeofenceDisplaySource(session.geofenceSource, false),
          description: getGeofenceDescription(session.geofenceSource, false),
        }
      : null;
  const geofenceItems = displayedGeofence
    ? [
        { label: "Yoklama Alanı", value: "Tanımlı" },
        {
          label: "Kaynak",
          value: displayedGeofence.source,
        },
        {
          label: "Latitude",
          value: displayedGeofence.latitude?.toString() ?? "Belirtilmedi",
        },
        {
          label: "Longitude",
          value: displayedGeofence.longitude?.toString() ?? "Belirtilmedi",
        },
        {
          label: "Radius",
          value: formatMeters(displayedGeofence.radiusMeters),
        },
        {
          label: "Açıklama",
          value: displayedGeofence.description,
        },
        {
          label: "Konum Doğruluğu",
          value: formatDecimalMeters(displayedGeofence.accuracyMeters),
        },
        {
          label: "Konum Alındı",
          value: displayedGeofence.capturedAt
            ? formatDateTimeTr(displayedGeofence.capturedAt)
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
        {session.status === "DRAFT" || session.status === "SCHEDULED" ? (
          <form action={startInstructorSessionAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Oturumu Başlat
            </button>
          </form>
        ) : null}
        <StatusBadge
          label={getAttendanceSessionStatusLabel(session.status)}
          tone={getSessionTone(session.status)}
        />
      </PageHeader>

      {started ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Yoklama oturumu başlatıldı.
        </div>
      ) : null}

      {startError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Oturum şu anda başlatılamadı. Lütfen durumu kontrol edip tekrar
          deneyin.
        </div>
      ) : null}

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
            {displayedGeofence ? (
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
        description="Öğrenci QR okuttuğunda konum sonucu bu listede görünür."
      >
        {session.attendanceRecords.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Öğrenci</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Yoklama Zamanı</th>
                    <th className="px-4 py-3">Mesafe</th>
                    <th className="px-4 py-3">Konum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {session.attendanceRecords.map((record) => {
                    const latestPresenceCheck = record.presenceChecks[0] ?? null;

                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-neutral-950">
                            {record.studentUser.name ?? "İsimsiz öğrenci"}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {record.studentUser.email}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            label={getAttendanceRecordStatusLabel(record.status)}
                            tone={getAttendanceTone(record.status)}
                          />
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {record.checkedInAt
                            ? formatDateTimeTr(record.checkedInAt)
                            : "Henüz katılmadı"}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          <p>{formatDecimalMeters(record.distanceMeters)}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Doğruluk:{" "}
                            {record.locationAccuracyMeters === null
                              ? "Belirtilmedi"
                              : `${record.locationAccuracyMeters} m`}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          <div className="grid gap-2">
                            <StatusBadge
                              label={getLocationVerificationLabel(
                                latestPresenceCheck?.status,
                                record.status,
                              )}
                              tone={getLocationVerificationTone(
                                latestPresenceCheck?.status,
                                record.status,
                              )}
                            />
                            <p className="text-xs leading-5 text-neutral-500">
                              {formatCoordinates(
                                record.locationLatitude,
                                record.locationLongitude,
                              )}
                            </p>
                            {record.rejectionReason ? (
                              <p className="text-xs leading-5 text-rose-700">
                                {record.rejectionReason}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {session.attendanceRecords.map((record) => {
                const latestPresenceCheck = record.presenceChecks[0] ?? null;

                return (
                  <article
                    key={record.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-950">
                          {record.studentUser.name ?? "İsimsiz öğrenci"}
                        </p>
                        <p className="mt-1 truncate text-sm text-neutral-500">
                          {record.studentUser.email}
                        </p>
                      </div>
                      <StatusBadge
                        label={getAttendanceRecordStatusLabel(record.status)}
                        tone={getAttendanceTone(record.status)}
                      />
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-neutral-500">Yoklama zamanı</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {record.checkedInAt
                            ? formatDateTimeTr(record.checkedInAt)
                            : "Henüz katılmadı"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Mesafe</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {formatDecimalMeters(record.distanceMeters)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Konum sonucu</dt>
                        <dd className="mt-1">
                          <StatusBadge
                            label={getLocationVerificationLabel(
                              latestPresenceCheck?.status,
                              record.status,
                            )}
                            tone={getLocationVerificationTone(
                              latestPresenceCheck?.status,
                              record.status,
                            )}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Konum</dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {formatCoordinates(
                            record.locationLatitude,
                            record.locationLongitude,
                          )}
                        </dd>
                      </div>
                    </dl>
                    {record.rejectionReason ? (
                      <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {record.rejectionReason}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            title="Henüz yoklama kaydı yok"
            description="Öğrenci QR kodu okutup konumu doğrulandığında kayıtlar burada listelenecek."
            icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
