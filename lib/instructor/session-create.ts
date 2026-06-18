import { AttendanceSessionGeofenceSource } from "@/lib/generated/prisma/enums";

export const INSTRUCTOR_SESSION_RADIUS_METERS_DEFAULT = 100;
export const INSTRUCTOR_SESSION_RADIUS_METERS_MIN = 10;
export const INSTRUCTOR_SESSION_RADIUS_METERS_MAX = 500;

export type InstructorSessionCreateOptionsData = {
  sections: Array<{
    id: string;
    name: string;
    code: string | null;
    course: {
      code: string;
      title: string;
    };
    _count: {
      enrollments: number;
    };
  }>;
  rooms: Array<{
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    allowedRadiusMeters: number | null;
  }>;
};

export type InstructorCreateSessionFormValues = {
  title: string;
  description: string;
  sectionId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  geofenceLatitude: string;
  geofenceLongitude: string;
  geofenceAccuracyMeters: string;
  geofenceRadiusMeters: string;
};

export type InstructorCreateSessionFormField =
  keyof InstructorCreateSessionFormValues;

export type InstructorCreateSessionFormErrors = Partial<
  Record<InstructorCreateSessionFormField, string>
>;

export type ValidInstructorCreateSessionInput = {
  title: string;
  description: string | null;
  sectionId: string;
  roomId: string | null;
  startTime: Date;
  endTime: Date;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceAccuracyMeters: number | null;
  geofenceRadiusMeters: number;
};

export type InstructorCreateSessionActionState = {
  status: "idle" | "error";
  message: string | null;
  values: InstructorCreateSessionFormValues;
  errors: InstructorCreateSessionFormErrors;
};

const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createInstructorSessionDefaultValues(
  now = new Date(),
): InstructorCreateSessionFormValues {
  const endTime = new Date(now.getTime() + 15 * 60_000);

  return {
    title: "Canlı Yoklama",
    description: "",
    sectionId: "",
    roomId: "",
    startTime: toDateTimeLocalValue(now),
    endTime: toDateTimeLocalValue(endTime),
    geofenceLatitude: "",
    geofenceLongitude: "",
    geofenceAccuracyMeters: "",
    geofenceRadiusMeters: String(INSTRUCTOR_SESSION_RADIUS_METERS_DEFAULT),
  };
}

export const initialInstructorCreateSessionActionState: InstructorCreateSessionActionState =
  {
    status: "idle",
    message: null,
    values: createInstructorSessionDefaultValues(),
    errors: {},
  };

function getFormValue(
  formData: FormData,
  field: InstructorCreateSessionFormField,
) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export function getInstructorCreateSessionFormValues(
  formData: FormData,
): InstructorCreateSessionFormValues {
  return {
    title: getFormValue(formData, "title"),
    description: getFormValue(formData, "description"),
    sectionId: getFormValue(formData, "sectionId"),
    roomId: getFormValue(formData, "roomId"),
    startTime: getFormValue(formData, "startTime"),
    endTime: getFormValue(formData, "endTime"),
    geofenceLatitude: getFormValue(formData, "geofenceLatitude"),
    geofenceLongitude: getFormValue(formData, "geofenceLongitude"),
    geofenceAccuracyMeters: getFormValue(formData, "geofenceAccuracyMeters"),
    geofenceRadiusMeters: getFormValue(formData, "geofenceRadiusMeters"),
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

export function validateInstructorCreateSessionFormValues(
  values: InstructorCreateSessionFormValues,
):
  | {
      ok: true;
      data: ValidInstructorCreateSessionInput;
    }
  | {
      ok: false;
      errors: InstructorCreateSessionFormErrors;
    } {
  const errors: InstructorCreateSessionFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const sectionId = values.sectionId.trim();
  const roomId = values.roomId.trim();
  const startTime = parseDateTimeLocal(values.startTime);
  const endTime = parseDateTimeLocal(values.endTime);
  const geofenceLatitude = parseOptionalNumber(values.geofenceLatitude);
  const geofenceLongitude = parseOptionalNumber(values.geofenceLongitude);
  const geofenceAccuracyMeters = parseOptionalNumber(
    values.geofenceAccuracyMeters,
  );
  const geofenceRadiusMeters = Number(values.geofenceRadiusMeters.trim());
  const hasLatitude = values.geofenceLatitude.trim() !== "";
  const hasLongitude = values.geofenceLongitude.trim() !== "";

  if (!title) {
    errors.title = "Oturum başlığı girin.";
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

  if (!Number.isInteger(geofenceRadiusMeters)) {
    errors.geofenceRadiusMeters = "Yarıçap metre cinsinden tam sayı olmalıdır.";
  } else if (
    geofenceRadiusMeters < INSTRUCTOR_SESSION_RADIUS_METERS_MIN ||
    geofenceRadiusMeters > INSTRUCTOR_SESSION_RADIUS_METERS_MAX
  ) {
    errors.geofenceRadiusMeters = `${INSTRUCTOR_SESSION_RADIUS_METERS_MIN} ile ${INSTRUCTOR_SESSION_RADIUS_METERS_MAX} metre arasında bir yarıçap seçin.`;
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
      sectionId,
      roomId: roomId || null,
      startTime,
      endTime,
      geofenceLatitude: hasLatitude ? geofenceLatitude : null,
      geofenceLongitude: hasLongitude ? geofenceLongitude : null,
      geofenceAccuracyMeters:
        hasLatitude && geofenceAccuracyMeters !== null
          ? geofenceAccuracyMeters
          : null,
      geofenceRadiusMeters,
    },
  };
}

export function getGeofenceSourceLabel(
  source: AttendanceSessionGeofenceSource,
) {
  return source === AttendanceSessionGeofenceSource.ROOM
    ? "Oda konumu"
    : "Oturum konumu";
}
