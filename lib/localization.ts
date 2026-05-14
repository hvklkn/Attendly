import type {
  AttendanceRecordStatus,
  AttendanceSessionGeofenceSource,
  AttendanceSessionStatus,
  AttendanceSource,
  AttendanceAlertSeverity,
  AttendanceAlertType,
  AttendanceVerificationLevel,
  EnrollmentStatus,
  MembershipRole,
  OrganizationStatus,
  PresenceCheckStatus,
  PresenceCheckType,
  UserStatus,
} from "@/lib/generated/prisma/enums";

const roleLabels: Record<MembershipRole, string> = {
  SUPER_ADMIN: "Sistem Yöneticisi",
  ORG_ADMIN: "Kurum Yöneticisi",
  INSTRUCTOR: "Öğretmen",
  STUDENT: "Öğrenci",
};

const attendanceSessionStatusLabels: Record<AttendanceSessionStatus, string> = {
  DRAFT: "Taslak",
  SCHEDULED: "Planlandı",
  ACTIVE: "Aktif",
  CLOSED: "Kapandı",
  CANCELLED: "İptal Edildi",
};

const attendanceSessionGeofenceSourceLabels: Record<
  AttendanceSessionGeofenceSource,
  string
> = {
  DEVICE: "Cihaz Konumu",
  ROOM: "Derslik Konumu",
  MANUAL: "Manuel Konum",
  NONE: "Tanımsız",
};

const attendanceRecordStatusLabels: Record<AttendanceRecordStatus, string> = {
  PRESENT: "Katıldı",
  LATE: "Geç Katıldı",
  ABSENT: "Katılmadı",
  EXCUSED: "Mazeretli",
  REJECTED: "Reddedildi",
  MANUAL: "Manuel",
};

const attendanceSourceLabels: Record<AttendanceSource, string> = {
  QR_SCAN: "QR Okutma",
  MANUAL_ENTRY: "Manuel Giriş",
  SYSTEM_GENERATED: "Sistem",
};

const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "Aktif",
  INVITED: "Davet Edildi",
  SUSPENDED: "Askıya Alındı",
  ARCHIVED: "Arşivlendi",
};

const organizationStatusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıya Alındı",
  ARCHIVED: "Arşivlendi",
};

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  WITHDRAWN: "Ayrıldı",
  SUSPENDED: "Askıya Alındı",
};

const attendanceVerificationLevelLabels: Record<
  AttendanceVerificationLevel,
  string
> = {
  INITIAL_ONLY: "İlk Giriş Doğrulandı",
  MID_SESSION_VERIFIED: "Ara Kontrolle Doğrulandı",
  CONTINUOUSLY_VERIFIED: "Ders Süresince Doğrulandı",
  SUSPICIOUS: "Şüpheli",
  MANUAL_REVIEW: "Manuel İnceleme",
};

const presenceCheckTypeLabels: Record<PresenceCheckType, string> = {
  INITIAL_CHECK_IN: "İlk Yoklama",
  PERIODIC_LOCATION: "Periyodik Konum Kontrolü",
  MID_SESSION_QR: "Ara Kontrol QR",
  MANUAL_CHECK: "Manuel Kontrol",
};

const presenceCheckStatusLabels: Record<PresenceCheckStatus, string> = {
  INSIDE_GEOFENCE: "Yoklama Alanı İçinde",
  OUTSIDE_GEOFENCE: "Yoklama Alanı Dışında",
  LOCATION_UNAVAILABLE: "Konum Alınamadı",
  QR_NOT_CONFIRMED: "QR Doğrulanmadı",
  SUSPICIOUS: "Şüpheli",
  VERIFIED: "Doğrulandı",
};

const attendanceAlertTypeLabels: Record<AttendanceAlertType, string> = {
  LEFT_GEOFENCE: "Yoklama Alanından Ayrıldı",
  MISSED_MID_SESSION_CHECK: "Ara Kontrolü Kaçırdı",
  LOCATION_PERMISSION_LOST: "Konum İzni Kaybedildi",
  SUSPICIOUS_RECHECK: "Şüpheli Yeniden Kontrol",
  DUPLICATE_ATTEMPT: "Tekrarlı Deneme",
  MANUAL_REVIEW: "Manuel İnceleme",
};

const attendanceAlertSeverityLabels: Record<AttendanceAlertSeverity, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
};

export function formatDateTimeTr(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(date));
}

export function formatDateTr(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(date));
}

export function getRoleLabel(role: MembershipRole | string) {
  return roleLabels[role as MembershipRole] ?? role.replaceAll("_", " ");
}

export function getAttendanceSessionStatusLabel(
  status: AttendanceSessionStatus | string,
) {
  return (
    attendanceSessionStatusLabels[status as AttendanceSessionStatus] ??
    status.replaceAll("_", " ")
  );
}

export function getAttendanceSessionGeofenceSourceLabel(
  source: AttendanceSessionGeofenceSource | string,
) {
  return (
    attendanceSessionGeofenceSourceLabels[
      source as AttendanceSessionGeofenceSource
    ] ?? source.replaceAll("_", " ")
  );
}

export function getAttendanceRecordStatusLabel(
  status: AttendanceRecordStatus | string,
) {
  return (
    attendanceRecordStatusLabels[status as AttendanceRecordStatus] ??
    status.replaceAll("_", " ")
  );
}

export function getAttendanceSourceLabel(source: AttendanceSource | string) {
  return (
    attendanceSourceLabels[source as AttendanceSource] ??
    source.replaceAll("_", " ")
  );
}

export function getUserStatusLabel(status: UserStatus | string) {
  return userStatusLabels[status as UserStatus] ?? status.replaceAll("_", " ");
}

export function getOrganizationStatusLabel(
  status: OrganizationStatus | string,
) {
  return (
    organizationStatusLabels[status as OrganizationStatus] ??
    status.replaceAll("_", " ")
  );
}

export function getEnrollmentStatusLabel(status: EnrollmentStatus | string) {
  return (
    enrollmentStatusLabels[status as EnrollmentStatus] ??
    status.replaceAll("_", " ")
  );
}

export function getAttendanceVerificationLevelLabel(
  level: AttendanceVerificationLevel | string,
) {
  return (
    attendanceVerificationLevelLabels[level as AttendanceVerificationLevel] ??
    level.replaceAll("_", " ")
  );
}

export function getPresenceCheckTypeLabel(type: PresenceCheckType | string) {
  return (
    presenceCheckTypeLabels[type as PresenceCheckType] ??
    type.replaceAll("_", " ")
  );
}

export function getPresenceCheckStatusLabel(
  status: PresenceCheckStatus | string,
) {
  return (
    presenceCheckStatusLabels[status as PresenceCheckStatus] ??
    status.replaceAll("_", " ")
  );
}

export function getAttendanceAlertTypeLabel(
  type: AttendanceAlertType | string,
) {
  return (
    attendanceAlertTypeLabels[type as AttendanceAlertType] ??
    type.replaceAll("_", " ")
  );
}

export function getAttendanceAlertSeverityLabel(
  severity: AttendanceAlertSeverity | string,
) {
  return (
    attendanceAlertSeverityLabels[severity as AttendanceAlertSeverity] ??
    severity.replaceAll("_", " ")
  );
}
