import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  AttendanceRecordStatus,
  type AttendanceSessionStatus,
} from "@/lib/generated/prisma/enums";
import { hashQrToken } from "@/lib/qr-tokens";
import {
  formatDateTimeTr,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";
import type { StudentScanResultCode } from "@/lib/student/attendance-result";
import type { AuthContext } from "@/types/auth";
import type { StatusTone } from "@/types/status";

type StudentScanResultPageProps = {
  searchParams: Promise<{
    code?: string | string[];
    recordId?: string | string[];
    sessionId?: string | string[];
    token?: string | string[];
  }>;
};

type ResultContent = {
  title: string;
  description: string;
  badge: string;
  tone: StatusTone;
  icon: ReactNode;
};

const RESULT_CODES = new Set<StudentScanResultCode>([
  "missing_token",
  "success",
  "late_success",
  "already_checked_in",
  "outside_geofence",
  "expired_token",
  "revoked_token",
  "invalid_token",
  "session_unavailable",
  "location_unavailable",
  "error",
]);

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCode(value: string | undefined): StudentScanResultCode {
  return RESULT_CODES.has(value as StudentScanResultCode)
    ? (value as StudentScanResultCode)
    : "error";
}

function getCodeFromRecord(status: AttendanceRecordStatus) {
  if (status === AttendanceRecordStatus.LATE) {
    return "late_success";
  }

  if (status === AttendanceRecordStatus.REJECTED) {
    return "outside_geofence";
  }

  return "success";
}

function getResultContent(code: StudentScanResultCode): ResultContent {
  if (code === "success") {
    return {
      title: "Yoklama başarıyla kaydedildi.",
      description: "Konumunuz sınıf alanı içinde doğrulandı.",
      badge: "Kaydedildi",
      tone: "success",
      icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "late_success") {
    return {
      title: "Yoklamanız geç olarak kaydedildi.",
      description: "Konumunuz doğrulandı, ancak geç kalma eşiği aşılmış.",
      badge: "Geç",
      tone: "warning",
      icon: <Clock3 className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "outside_geofence") {
    return {
      title: "Konum dışındasınız.",
      description: "Yoklama kaydı reddedildi ve öğretmen panelinde görünür.",
      badge: "Konum dışı",
      tone: "danger",
      icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "expired_token") {
    return {
      title: "QR kodun süresi dolmuş.",
      description: "Öğretmeninizden yeni QR kod isteyin.",
      badge: "Süresi doldu",
      tone: "warning",
      icon: <Clock3 className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "revoked_token") {
    return {
      title: "QR kod yenilenmiş.",
      description: "Ekrandaki güncel QR kodu tekrar okutun.",
      badge: "Yenilendi",
      tone: "warning",
      icon: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "already_checked_in") {
    return {
      title: "Yoklamanız zaten kayıtlı.",
      description: "Bu oturum için daha önce oluşturulan kayıt gösteriliyor.",
      badge: "Zaten kayıtlı",
      tone: "neutral",
      icon: <Ban className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "session_unavailable") {
    return {
      title: "Oturum şu anda uygun değil.",
      description: "Yoklama için oturumun aktif ve size açık olması gerekir.",
      badge: "Uygun değil",
      tone: "neutral",
      icon: <Ban className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "location_unavailable") {
    return {
      title: "Konumunuz alınamadı.",
      description: "Lütfen konum izni verip QR kodu tekrar okutun.",
      badge: "Konum yok",
      tone: "warning",
      icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "missing_token") {
    return {
      title: "QR kodu bulunamadı.",
      description: "Lütfen öğretmeninizin paylaştığı QR kodu tekrar okutun.",
      badge: "QR yok",
      tone: "warning",
      icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    };
  }

  if (code === "invalid_token") {
    return {
      title: "Yoklama kaydı oluşturulamadı.",
      description: "Lütfen QR kodu tekrar okutun.",
      badge: "Geçersiz",
      tone: "danger",
      icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    };
  }

  return {
    title: "Yoklama kaydı oluşturulamadı.",
    description: "Lütfen QR kodu tekrar okutun.",
    badge: "Hata",
    tone: "danger",
    icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  };
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
  latitude: { toString: () => string } | null | undefined,
  longitude: { toString: () => string } | null | undefined,
) {
  if (!latitude || !longitude) {
    return "Belirtilmedi";
  }

  return `${latitude.toString()}, ${longitude.toString()}`;
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
          className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]"
        >
          <dt className="text-sm font-medium text-neutral-500">{item.label}</dt>
          <dd className="text-sm font-medium text-neutral-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function getRecordResult(authContext: AuthContext, recordId: string) {
  return db.attendanceRecord.findFirst({
    where: {
      id: recordId,
      organizationId: authContext.activeOrganization.id,
      studentUserId: authContext.user.id,
      studentMembershipId: authContext.membership.id,
    },
    select: {
      id: true,
      status: true,
      checkedInAt: true,
      locationLatitude: true,
      locationLongitude: true,
      locationAccuracyMeters: true,
      distanceMeters: true,
      rejectionReason: true,
      attendanceSession: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          geofenceRadiusMeters: true,
          section: {
            select: {
              name: true,
              code: true,
              course: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function getSessionResult(authContext: AuthContext, sessionId: string) {
  return db.attendanceSession.findFirst({
    where: {
      id: sessionId,
      organizationId: authContext.activeOrganization.id,
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
      geofenceRadiusMeters: true,
      section: {
        select: {
          name: true,
          code: true,
          course: {
            select: {
              code: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

async function getSessionResultByToken(authContext: AuthContext, token: string) {
  const qrToken = await db.qRToken.findUnique({
    where: {
      tokenHash: hashQrToken(token),
    },
    select: {
      organizationId: true,
      attendanceSession: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          geofenceRadiusMeters: true,
          section: {
            select: {
              name: true,
              code: true,
              course: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!qrToken || qrToken.organizationId !== authContext.activeOrganization.id) {
    return null;
  }

  return qrToken.attendanceSession;
}

function getSessionItems(session: {
  title: string;
  startTime: Date;
  endTime: Date;
  status: AttendanceSessionStatus;
  geofenceRadiusMeters: number | null;
  section: {
    name: string;
    code: string | null;
    course: {
      code: string;
      title: string;
    };
  };
}) {
  const sectionLabel = session.section.code
    ? `${session.section.course.code} - ${session.section.code} - ${session.section.name}`
    : `${session.section.course.code} - ${session.section.name}`;

  return [
    { label: "Ders", value: session.section.course.title },
    { label: "Ders grubu", value: sectionLabel },
    { label: "Oturum", value: session.title },
    { label: "Başlangıç", value: formatDateTimeTr(session.startTime) },
    { label: "Bitiş", value: formatDateTimeTr(session.endTime) },
    { label: "Oturum durumu", value: getAttendanceSessionStatusLabel(session.status) },
    {
      label: "Yoklama yarıçapı",
      value:
        session.geofenceRadiusMeters === null
          ? "Belirtilmedi"
          : `${session.geofenceRadiusMeters} metre`,
    },
  ];
}

export default async function StudentScanResultPage({
  searchParams,
}: StudentScanResultPageProps) {
  const [resolvedSearchParams, authContext] = await Promise.all([
    searchParams,
    requireRole("STUDENT"),
  ]);
  const requestedCode = normalizeCode(getParam(resolvedSearchParams.code));
  const recordId = getParam(resolvedSearchParams.recordId)?.trim();
  const sessionId = getParam(resolvedSearchParams.sessionId)?.trim();
  const token = getParam(resolvedSearchParams.token)?.trim();
  const record = recordId
    ? await getRecordResult(authContext, recordId)
    : null;
  const session =
    record?.attendanceSession ??
    (sessionId ? await getSessionResult(authContext, sessionId) : null) ??
    (token ? await getSessionResultByToken(authContext, token) : null);
  const resultCode = record
    ? requestedCode === "already_checked_in"
      ? requestedCode
      : getCodeFromRecord(record.status)
    : requestedCode;
  const content = getResultContent(resultCode);
  const recordItems = record
    ? [
        {
          label: "Kayıt durumu",
          value: getAttendanceRecordStatusLabel(record.status),
        },
        {
          label: "Yoklama zamanı",
          value: record.checkedInAt
            ? formatDateTimeTr(record.checkedInAt)
            : "Belirtilmedi",
        },
        {
          label: "Mesafe",
          value: formatDecimalMeters(record.distanceMeters),
        },
        {
          label: "Konum sonucu",
          value:
            record.status === AttendanceRecordStatus.REJECTED
              ? "Konum dışı"
              : "Konum içi",
        },
        {
          label: "Konum",
          value: formatCoordinates(
            record.locationLatitude,
            record.locationLongitude,
          ),
        },
        {
          label: "Konum doğruluğu",
          value:
            record.locationAccuracyMeters === null
              ? "Belirtilmedi"
              : `${record.locationAccuracyMeters} metre`,
        },
        {
          label: "Açıklama",
          value: record.rejectionReason ?? content.description,
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Okutma Sonucu"
        description="Yoklama katılım durumunuz."
      >
        <StatusBadge label={content.badge} tone={content.tone} />
      </PageHeader>

      <SectionCard
        title={content.title}
        description={content.description}
        actions={<StatusBadge label={content.badge} tone={content.tone} />}
      >
        <div className="grid gap-5">
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-neutral-700 shadow-subtle">
              {content.icon}
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-950">
                {content.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                {content.description}
              </p>
            </div>
          </div>

          {session ? (
            <DetailList items={[...getSessionItems(session), ...recordItems]} />
          ) : (
            <EmptyState
              title="Oturum bilgisi bulunamadı"
              description="Lütfen QR kodu tekrar okutun."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}
