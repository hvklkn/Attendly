export type AdminCourseCreateFormValues = {
  title: string;
  code: string;
  description: string;
  isActive: string;
};

export type AdminCourseCreateFormField = keyof AdminCourseCreateFormValues;

export type AdminCourseCreateFormErrors = Partial<
  Record<AdminCourseCreateFormField, string>
>;

export type AdminCourseCreateActionState = {
  status: "idle" | "error";
  message: string | null;
  values: AdminCourseCreateFormValues;
  errors: AdminCourseCreateFormErrors;
};

export type ValidAdminCourseCreateInput = {
  title: string;
  code: string;
  description: string | null;
  isActive: boolean;
};

export const initialAdminCourseCreateFormValues: AdminCourseCreateFormValues = {
  title: "",
  code: "",
  description: "",
  isActive: "on",
};

export const initialAdminCourseCreateActionState: AdminCourseCreateActionState =
  {
    status: "idle",
    message: null,
    values: initialAdminCourseCreateFormValues,
    errors: {},
  };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

export function getAdminCourseCreateFormValues(
  formData: FormData,
): AdminCourseCreateFormValues {
  return {
    title: String(
      formData.get("title") ?? initialAdminCourseCreateFormValues.title,
    ),
    code: String(
      formData.get("code") ?? initialAdminCourseCreateFormValues.code,
    ),
    description: String(
      formData.get("description") ??
        initialAdminCourseCreateFormValues.description,
    ),
    isActive: formData.get("isActive") === "on" ? "on" : "",
  };
}

export function validateAdminCourseCreateFormValues(
  values: AdminCourseCreateFormValues,
):
  | {
      ok: true;
      values: AdminCourseCreateFormValues;
      data: ValidAdminCourseCreateInput;
    }
  | {
      ok: false;
      values: AdminCourseCreateFormValues;
      errors: AdminCourseCreateFormErrors;
    } {
  const title = normalizeText(values.title);
  const code = normalizeCode(values.code);
  const description = values.description.trim();
  const isActive = values.isActive === "on" ? "on" : "";
  const normalizedValues: AdminCourseCreateFormValues = {
    title,
    code,
    description,
    isActive,
  };
  const errors: AdminCourseCreateFormErrors = {};

  if (!title) {
    errors.title = "Ders / kurs adı zorunludur.";
  }

  if (!code) {
    errors.code = "Kod zorunludur.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      values: normalizedValues,
      errors,
    };
  }

  return {
    ok: true,
    values: normalizedValues,
    data: {
      title,
      code,
      description: description || null,
      isActive: isActive === "on",
    },
  };
}
