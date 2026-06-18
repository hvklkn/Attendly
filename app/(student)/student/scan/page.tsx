import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { resolveAttendanceGeofence } from "@/lib/geofence";
import {
  formatDateTimeTr,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";
import {
  validateStudentScanToken,
  type StudentScanValidationResult,
  type StudentScanValidationStatus,
} from "@/lib/student/scan-validation";
import type { StatusTone } from "@/types/status";
import { StudentQrScanner } from "./StudentQrScanner";
import { StudentAttendanceCheckIn } from "./StudentAttendanceCheckIn";

type StudentScanPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

type ScanStateContent = {
  title: string;
  description: string;
  badge: string;
  tone: StatusTone;
  icon: ReactNode;
};

function getTokenParam(token: string | string[] | undefined) {
  return Array.isArray(token) ? token[0] : token;
}

function formatDateTime(date: Date) {
  return formatDateTimeTr(date);
}

function formatEnum(value: string) {
  return getAttendanceSessionStatusLabel(value);
}

function getScanStateContent(
  status: Exclude<StudentScanValidationStatus, "valid">,
): ScanStateContent {
  if (status === "missing_token") {
    return {
      title: "QR kodu bulunamadı",
      description: "Devam etmek için QR kodu okutun veya geçerli okutma bağlantısını açın.",
      badge: "QR yok",
      tone: "neutral",
      icon: <QrCode className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (status === "invalid_token") {
    return {
      title: "Geçersiz QR kodu",
      description: "Bu okutma bağlantısı kullanılabilir bir oturumla eşleşmiyor.",
      badge: "Geçersiz",
      tone: "danger",
      icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (status === "revoked_token") {
    return {
      title: "QR kodu yenilendi",
      description: "Güncel QR kodu için öğretmeninize başvurun.",
      badge: "Yenilendi",
      tone: "warning",
      icon: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (status === "expired_token") {
    return {
      title: "QR kodunun süresi doldu",
      description: "Öğretmeninizden QR kodunu yenilemesini isteyin.",
      badge: "Süresi doldu",
      tone: "warning",
      icon: <Clock3 className="h-5 w-5" aria-hidden="true" />,
    };
  }

  return {
    title: "Oturum uygun değil",
    description: "Bu oturum şu anda yoklama için uygun değil.",
    badge: "Uygun değil",
    tone: "neutral",
    icon: <Ban className="h-5 w-5" aria-hidden="true" />,
  };
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
          className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[130px_1fr]"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="text-sm font-medium text-neutral-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function InvalidScanResult({
  result,
}: {
  result: Exclude<StudentScanValidationResult, { status: "valid" }>;
}) {
  const content = getScanStateContent(result.status);

  return (
    <SectionCard
      title="Okutma Sonucu"
      description="QR kodu güvenli oturum bilgileriyle kontrol edildi."
      actions={<StatusBadge label={content.badge} tone={content.tone} />}
    >
      <EmptyState
        title={content.title}
        description={content.description}
        icon={content.icon}
        className="min-h-72"
      />
    </SectionCard>
  );
}

function ValidScanResult({
  result,
  rawToken,
}: {
  result: Extract<StudentScanValidationResult, { status: "valid" }>;
  rawToken: string;
}) {
  const { session } = result;
  const courseAndSection = session.section.code
    ? `${session.section.course.code} - ${session.section.code} - ${session.section.name}`
    : `${session.section.course.code} - ${session.section.name}`;
  const room = session.room
    ? session.room.code
      ? `${session.room.code} - ${session.room.name}`
      : session.room.name
    : "Atanmadı";
  const location = session.room?.address ?? "Belirtilmedi";
  const geofence = resolveAttendanceGeofence({
    session,
    room: session.room,
  });
  const radius = geofence ? `${geofence.radiusMeters} metre` : "Belirtilmedi";
  const geofenceCenter = geofence
    ? `${geofence.latitude.toFixed(6)}, ${geofence.longitude.toFixed(6)}`
    : "Belirtilmedi";

  const sessionItems = [
    { label: "Ders", value: session.section.course.title },
    { label: "Şube", value: courseAndSection },
    { label: "Başlangıç", value: formatDateTime(session.startTime) },
    { label: "Bitiş", value: formatDateTime(session.endTime) },
    { label: "Oda", value: room },
    { label: "Konum", value: location },
    { label: "Yoklama merkezi", value: geofenceCenter },
    { label: "Yarıçap", value: radius },
    { label: "QR bitişi", value: formatDateTime(result.tokenExpiresAt) },
  ];

  const studentItems = [
    {
      label: "Öğrenci",
      value: result.student.name
        ? `${result.student.name} - ${result.student.email}`
        : result.student.email,
    },
    { label: "Kurum", value: result.organization.name },
  ];

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Okutma Sonucu"
        description="Bu QR kodu aşağıdaki oturum için geçerli."
        actions={<StatusBadge label="Geçerli" tone="success" />}
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 shadow-subtle">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-950">
                    {session.title}
                  </h2>
                  <StatusBadge
                    label={formatEnum(session.status)}
                    tone={session.status === "ACTIVE" ? "success" : "info"}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Yoklamayı tamamlamak için konumunuzu paylaşın. Sistem
                  konumunuzu oturumun yoklama alanıyla karşılaştıracak.
                </p>
              </div>
            </div>
          </div>

          <StudentAttendanceCheckIn token={rawToken} />
        </div>
      </SectionCard>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <SectionCard
          title="Oturum Bilgileri"
          description="Bu okutma için güvenli oturum bilgileri."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={sessionItems} />
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard
            title="Öğrenci Bağlamı"
            description="Okutma aktif kurumunuz içinde doğrulandı."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <DetailList items={studentItems} />
          </SectionCard>

          <SectionCard
            title="Oda"
            description="Konum bilgileri bu adımda yalnızca referans amaçlı gösterilir."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            {session.room ? (
              <DetailList
                items={[
                  { label: "Oda", value: room },
                  { label: "Adres", value: location },
                  { label: "Yoklama merkezi", value: geofenceCenter },
                  { label: "Yarıçap", value: radius },
                ]}
              />
            ) : (
              <EmptyState
                title="Oda atanmadı"
                description="Bu oturuma bağlı oda bilgisi yok."
                icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            )}
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

export default async function StudentScanPage({
  searchParams,
}: StudentScanPageProps) {
  const [{ token }, authContext] = await Promise.all([
    searchParams,
    requireRole("STUDENT"),
  ]);
  const rawToken = getTokenParam(token)?.trim();

  if (!rawToken) {
    return (
      <>
        <PageHeader
          eyebrow={authContext.activeOrganization.name}
          title="QR Okut"
          description="QR kodu telefonunuzun kamera uygulamasıyla okutun veya eğitmeninizden yoklama bağlantısını isteyin."
        >
          <StatusBadge label="Tarayıcı" tone="info" />
        </PageHeader>

        <StudentQrScanner />
      </>
    );
  }

  const result = await validateStudentScanToken(authContext, rawToken);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="QR Kod Okut"
        description="Yoklamaya katılmadan önce oturum QR kodunu doğrulayın."
      >
        <StatusBadge
          label={result.status === "valid" ? "Hazır" : "QR gerekli"}
          tone={result.status === "valid" ? "success" : "neutral"}
        />
      </PageHeader>

      {result.status === "valid" ? (
        <ValidScanResult result={result} rawToken={rawToken} />
      ) : (
        <InvalidScanResult result={result} />
      )}
    </>
  );
}
