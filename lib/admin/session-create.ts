import { AttendanceSessionGeofenceSource } from "@/lib/generated/prisma/enums";

export const LATE_THRESHOLD_MINUTES_DEFAULT = 10;
export const LATE_THRESHOLD_MINUTES_MIN = 0;
export const LATE_THRESHOLD_MINUTES_MAX = 180;
export const GEOFENCE_RADIUS_METERS_DEFAULT = 50;
export const GEOFENCE_RADIUS_METERS_MIN = 10;
export const GEOFENCE_RADIUS_METERS_MAX = 500;
export const GEOFENCE_RADIUS_OPTIONS = [25, 50, 100, 150] as const;

const GEOFENCE_SOURCES = [
  AttendanceSessionGeofenceSource.DEVICE,
  AttendanceSessionGeofenceSource.ROOM,
  AttendanceSessionGeofenceSource.MANUAL,
  AttendanceSessionGeofenceSource.NONE,
] as const;

export type AdminSessionCreateOptionsData = {
  courses: Array<{
    id: string;
    code: string;
    title: string;
    _count: {
      sections: number;
    };
  }>;
  sections: Array<{
    id: string;
    name: string;
    code: string | null;
    courseId: string;
    course: {
      code: string;
      title: string;
    };
    instructorMembership: {
      id: string;
      role: string;
      user: {
        name: string | null;
        email: string;
      };
    } | null;
    _count: {
      enrollments: number;
    };
  }>;
  rooms: Array<{
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    allowedRadiusMeters: number | null;
  }>;
  responsibleCandidates: Array<{
    id: string;
    role: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
};

export type CreateSessionFormValues = {
  title: string;
  description: string;
  instructorMembershipId: string;
  courseId: string;
  sectionId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  lateThresholdMinutes: string;
  geofenceLatitude: string;
  geofenceLongitude: string;
  geofenceAccuracyMeters: string;
  geofenceRadiusMeters: string;
  geofenceSource: string;
  allowWithoutGeofence: string;
};

export type CreateSessionFormField = keyof CreateSessionFormValues;

export type CreateSessionFormErrors = Partial<
  Record<CreateSessionFormField, string>
>;

export type ValidCreateSessionInput = {
  title: string;
  description: string | null;
  instructorMembershipId: string | null;
  courseId: string | null;
  sectionId: string;
  roomId: string | null;
  startTime: Date;
  endTime: Date;
  lateThresholdMinutes: number;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceAccuracyMeters: number | null;
  geofenceRadiusMeters: number | null;
  geofenceSource: AttendanceSessionGeofenceSource;
  geofenceCapturedAt: Date | null;
};

export type CreateSessionActionState = {
  status: "idle" | "error";
  message: string | null;
  values: CreateSessionFormValues;
  errors: CreateSessionFormErrors;
};

export const initialCreateSessionFormValues: CreateSessionFormValues = {
  title: "",
  description: "",
  instructorMembershipId: "",
  courseId: "",
  sectionId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  lateThresholdMinutes: String(LATE_THRESHOLD_MINUTES_DEFAULT),
  geofenceLatitude: "",
  geofenceLongitude: "",
  geofenceAccuracyMeters: "",
  geofenceRadiusMeters: String(GEOFENCE_RADIUS_METERS_DEFAULT),
  geofenceSource: AttendanceSessionGeofenceSource.NONE,
  allowWithoutGeofence: "",
};

export const initialCreateSessionActionState: CreateSessionActionState = {
  status: "idle",
  message: null,
  values: initialCreateSessionFormValues,
  errors: {},
};

const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

function getFormValue(formData: FormData, field: CreateSessionFormField) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export function getCreateSessionFormValues(
  formData: FormData,
): CreateSessionFormValues {
  return {
    title: getFormValue(formData, "title"),
    description: getFormValue(formData, "description"),
    instructorMembershipId: getFormValue(formData, "instructorMembershipId"),
    courseId: getFormValue(formData, "courseId"),
    sectionId: getFormValue(formData, "sectionId"),
    roomId: getFormValue(formData, "roomId"),
    startTime: getFormValue(formData, "startTime"),
    endTime: getFormValue(formData, "endTime"),
    lateThresholdMinutes: getFormValue(formData, "lateThresholdMinutes"),
    geofenceLatitude: getFormValue(formData, "geofenceLatitude"),
    geofenceLongitude: getFormValue(formData, "geofenceLongitude"),
    geofenceAccuracyMeters: getFormValue(formData, "geofenceAccuracyMeters"),
    geofenceRadiusMeters: getFormValue(formData, "geofenceRadiusMeters"),
    geofenceSource: getFormValue(formData, "geofenceSource"),
    allowWithoutGeofence:
      formData.get("allowWithoutGeofence") === "on" ? "on" : "",
  };
}

function parseDateTimeLocal(value: string) {
  const trimmedValue = value.trim();

  if (!DATE_TIME_LOCAL_PATTERN.test(trimmedValue)) {
    return null;
  }

  const date = new Date(trimmedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const numberValue = Number(trimmedValue);

  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function isGeofenceSource(
  value: string,
): value is AttendanceSessionGeofenceSource {
  return GEOFENCE_SOURCES.some((source) => source === value);
}

export function validateCreateSessionFormValues(
  values: CreateSessionFormValues,
):
  | {
      ok: true;
      data: ValidCreateSessionInput;
    }
  | {
      ok: false;
      errors: CreateSessionFormErrors;
    } {
  const errors: CreateSessionFormErrors = {};

  const title = values.title.trim();
  const description = values.description.trim();
  const instructorMembershipId = values.instructorMembershipId.trim();
  const courseId = values.courseId.trim();
  const sectionId = values.sectionId.trim();
  const roomId = values.roomId.trim();
  const startTime = parseDateTimeLocal(values.startTime);
  const endTime = parseDateTimeLocal(values.endTime);
  const lateThresholdValue = values.lateThresholdMinutes.trim();
  const lateThresholdMinutes =
    lateThresholdValue === ""
      ? LATE_THRESHOLD_MINUTES_DEFAULT
      : Number(lateThresholdValue);
  const geofenceLatitude = parseOptionalNumber(values.geofenceLatitude);
  const geofenceLongitude = parseOptionalNumber(values.geofenceLongitude);
  const geofenceAccuracyMeters = parseOptionalNumber(
    values.geofenceAccuracyMeters,
  );
  const geofenceRadiusValue = values.geofenceRadiusMeters.trim();
  const geofenceRadiusMeters =
    geofenceRadiusValue === ""
      ? null
      : Number(values.geofenceRadiusMeters);
  const allowWithoutGeofence = values.allowWithoutGeofence === "on";
  const hasLatitude = values.geofenceLatitude.trim() !== "";
  const hasLongitude = values.geofenceLongitude.trim() !== "";
  const hasGeofenceLocation = hasLatitude || hasLongitude;
  const geofenceSourceValue = values.geofenceSource.trim();
  const rawGeofenceSource = hasGeofenceLocation
    ? geofenceSourceValue || AttendanceSessionGeofenceSource.DEVICE
    : AttendanceSessionGeofenceSource.NONE;
  const geofenceSource = isGeofenceSource(rawGeofenceSource)
    ? rawGeofenceSource
    : AttendanceSessionGeofenceSource.NONE;

  if (!title) {
    errors.title = "Oturum başlığı girin.";
  }

  if (!courseId) {
    errors.courseId = "Ders / kurs seçilmelidir.";
  }

  if (!sectionId) {
    errors.sectionId = "Ders grubu seçilmelidir.";
  }

  if (!values.startTime.trim()) {
    errors.startTime = "Başlangıç zamanı seçin.";
  } else if (!startTime) {
    errors.startTime = "Geçerli bir başlangıç zamanı girin.";
  }

  if (!values.endTime.trim()) {
    errors.endTime = "Bitiş zamanı seçin.";
  } else if (!endTime) {
    errors.endTime = "Geçerli bir bitiş zamanı girin.";
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.endTime = "Bitiş zamanı başlangıç zamanından sonra olmalıdır.";
  }

  if (!Number.isInteger(lateThresholdMinutes)) {
    errors.lateThresholdMinutes = "Dakika değerini tam sayı girin.";
  } else if (
    lateThresholdMinutes < LATE_THRESHOLD_MINUTES_MIN ||
    lateThresholdMinutes > LATE_THRESHOLD_MINUTES_MAX
  ) {
    errors.lateThresholdMinutes = `${LATE_THRESHOLD_MINUTES_MIN} ile ${LATE_THRESHOLD_MINUTES_MAX} dakika arasında bir değer kullanın.`;
  }

  if (!hasGeofenceLocation && !allowWithoutGeofence) {
    errors.geofenceLatitude =
      "Cihaz konumunuzu alın veya konum doğrulamasız oluşturma seçeneğini işaretleyin.";
  }

  if (hasLatitude !== hasLongitude) {
    errors.geofenceLatitude = "Enlem ve boylam birlikte gönderilmelidir.";
    errors.geofenceLongitude = "Enlem ve boylam birlikte gönderilmelidir.";
  }

  if (
    hasLatitude &&
    (geofenceLatitude === null || Number.isNaN(geofenceLatitude))
  ) {
    errors.geofenceLatitude = "Geçerli bir enlem değeri alınamadı.";
  } else if (
    typeof geofenceLatitude === "number" &&
    (geofenceLatitude < -90 || geofenceLatitude > 90)
  ) {
    errors.geofenceLatitude = "Enlem -90 ile 90 arasında olmalıdır.";
  }

  if (
    hasLongitude &&
    (geofenceLongitude === null || Number.isNaN(geofenceLongitude))
  ) {
    errors.geofenceLongitude = "Geçerli bir boylam değeri alınamadı.";
  } else if (
    typeof geofenceLongitude === "number" &&
    (geofenceLongitude < -180 || geofenceLongitude > 180)
  ) {
    errors.geofenceLongitude = "Boylam -180 ile 180 arasında olmalıdır.";
  }

  if (
    geofenceAccuracyMeters !== null &&
    (Number.isNaN(geofenceAccuracyMeters) || geofenceAccuracyMeters < 0)
  ) {
    errors.geofenceAccuracyMeters =
      "Konum doğruluğu sıfır veya pozitif olmalıdır.";
  }

  if (hasGeofenceLocation) {
    if (
      geofenceRadiusMeters === null ||
      !Number.isInteger(geofenceRadiusMeters)
    ) {
      errors.geofenceRadiusMeters =
        "Yarıçap metre cinsinden tam sayı olmalıdır.";
    } else if (
      geofenceRadiusMeters < GEOFENCE_RADIUS_METERS_MIN ||
      geofenceRadiusMeters > GEOFENCE_RADIUS_METERS_MAX
    ) {
      errors.geofenceRadiusMeters = `${GEOFENCE_RADIUS_METERS_MIN} ile ${GEOFENCE_RADIUS_METERS_MAX} metre arasında bir yarıçap seçin.`;
    }

    if (!isGeofenceSource(rawGeofenceSource)) {
      errors.geofenceSource = "Geçerli bir konum kaynağı seçin.";
    } else if (geofenceSource === AttendanceSessionGeofenceSource.NONE) {
      errors.geofenceSource =
        "Konum alındığında kaynak cihaz, derslik veya manuel olmalıdır.";
    }
  }

  if (Object.keys(errors).length > 0 || !startTime || !endTime) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      title,
      description: description || null,
      instructorMembershipId: instructorMembershipId || null,
      courseId: courseId || null,
      sectionId,
      roomId: roomId || null,
      startTime,
      endTime,
      lateThresholdMinutes,
      geofenceLatitude: hasGeofenceLocation ? geofenceLatitude : null,
      geofenceLongitude: hasGeofenceLocation ? geofenceLongitude : null,
      geofenceAccuracyMeters:
        hasGeofenceLocation && geofenceAccuracyMeters !== null
          ? geofenceAccuracyMeters
          : null,
      geofenceRadiusMeters:
        hasGeofenceLocation && geofenceRadiusMeters !== null
          ? geofenceRadiusMeters
          : null,
      geofenceSource: hasGeofenceLocation
        ? geofenceSource
        : AttendanceSessionGeofenceSource.NONE,
      geofenceCapturedAt: hasGeofenceLocation ? new Date() : null,
    },
  };
}
