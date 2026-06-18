import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Lock,
  MapPin,
  PlayCircle,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  closeInstructorSessionAction,
  startInstructorSessionAction,
} from "@/lib/instructor/session-actions";
import { getInstructorSessionDetailData } from "@/lib/instructor/queries";
import { getInstructorSessionLiveData } from "@/lib/instructor/session-live";
import {
  formatDateTimeTr,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";
import { InstructorSessionQrTokenPanel } from "./InstructorSessionQrTokenPanel";
import { InstructorSessionLivePanel } from "./InstructorSessionLivePanel";

type InstructorSessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    closed?: string | string[];
    closeError?: string | string[];
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

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  if (status === "CLOSED") return "neutral" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
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
  const [data, liveData] = await Promise.all([
    getInstructorSessionDetailData(authContext, sessionId),
    getInstructorSessionLiveData(authContext, sessionId),
  ]);

  if (!data || !liveData) {
    notFound();
  }

  const { session } = data;
  const latestQrToken = data.latestQrToken;
  const closed =
    (Array.isArray(resolvedSearchParams?.closed)
      ? resolvedSearchParams?.closed[0]
      : resolvedSearchParams?.closed) === "1";
  const closeError =
    (Array.isArray(resolvedSearchParams?.closeError)
      ? resolvedSearchParams?.closeError[0]
      : resolvedSearchParams?.closeError) === "1";
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
        {session.status === "ACTIVE" ? (
          <form action={closeInstructorSessionAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Yoklamayı Kapat
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

      {closed ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
          Yoklama oturumu kapatıldı. Bu oturum için yeni QR üretilemez.
        </div>
      ) : null}

      {closeError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Oturum şu anda kapatılamadı. Lütfen durumu kontrol edip tekrar
          deneyin.
        </div>
      ) : null}

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
          description="Oturum konumu ve oda bilgisi öğrenci check-in doğrulamasında kullanılır."
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

        <SectionCard
          title="Konum Doğrulama"
          description="Öğrenci konumu bu yoklama alanıyla karşılaştırılarak kabul veya ret kararı verilir."
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
      </section>

      <InstructorSessionLivePanel
        sessionId={session.id}
        initialData={liveData}
      />
    </>
  );
}
