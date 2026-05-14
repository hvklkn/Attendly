import type {
  AttendanceRecordStatus,
  AttendanceSessionStatus,
  AttendanceSource,
  EnrollmentStatus,
  MembershipRole,
  OrganizationStatus,
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
