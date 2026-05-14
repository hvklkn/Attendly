export const LATE_THRESHOLD_MINUTES_DEFAULT = 10;
export const LATE_THRESHOLD_MINUTES_MIN = 0;
export const LATE_THRESHOLD_MINUTES_MAX = 180;

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
  instructors: Array<{
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
  courseId: string;
  sectionId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  lateThresholdMinutes: string;
};

export type CreateSessionFormField = keyof CreateSessionFormValues;

export type CreateSessionFormErrors = Partial<
  Record<CreateSessionFormField, string>
>;

export type ValidCreateSessionInput = {
  title: string;
  description: string | null;
  courseId: string | null;
  sectionId: string;
  roomId: string | null;
  startTime: Date;
  endTime: Date;
  lateThresholdMinutes: number;
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
  courseId: "",
  sectionId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  lateThresholdMinutes: String(LATE_THRESHOLD_MINUTES_DEFAULT),
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
    courseId: getFormValue(formData, "courseId"),
    sectionId: getFormValue(formData, "sectionId"),
    roomId: getFormValue(formData, "roomId"),
    startTime: getFormValue(formData, "startTime"),
    endTime: getFormValue(formData, "endTime"),
    lateThresholdMinutes: getFormValue(formData, "lateThresholdMinutes"),
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

  if (!title) {
    errors.title = "Oturum başlığı girin.";
  }

  if (!sectionId) {
    errors.sectionId = "Bir şube seçin.";
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
      courseId: courseId || null,
      sectionId,
      roomId: roomId || null,
      startTime,
      endTime,
      lateThresholdMinutes,
    },
  };
}
