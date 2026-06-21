import type { EnrollmentStatus } from "@/lib/generated/prisma/enums";

export const INSTRUCTOR_STUDENT_PASSWORD_MIN_LENGTH = 8;

export type InstructorStudentCreateOptionsData = {
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
};

export type InstructorStudentCreateFormValues = {
  name: string;
  email: string;
  password: string;
  sectionId: string;
};

export type InstructorStudentCreateFormField =
  keyof InstructorStudentCreateFormValues;

export type InstructorStudentCreateFormErrors = Partial<
  Record<InstructorStudentCreateFormField, string>
>;

export type InstructorStudentCreateActionState = {
  status: "idle" | "error";
  message: string | null;
  values: InstructorStudentCreateFormValues;
  errors: InstructorStudentCreateFormErrors;
};

export type InstructorStudentEditFormValues = {
  name: string;
  studentNo: string;
};

export type InstructorStudentEditFormField =
  keyof InstructorStudentEditFormValues;

export type InstructorStudentEditFormErrors = Partial<
  Record<InstructorStudentEditFormField, string>
>;

export type InstructorStudentEditActionState = {
  status: "idle" | "error";
  message: string | null;
  values: InstructorStudentEditFormValues;
  errors: InstructorStudentEditFormErrors;
};

export type ValidInstructorStudentEditInput = {
  name: string;
  studentNo: string | null;
};

export type ValidInstructorStudentCreateInput = {
  name: string;
  email: string;
  password: string;
  sectionId: string;
  enrollmentStatus: Extract<EnrollmentStatus, "ACTIVE">;
};

export const initialInstructorStudentCreateFormValues: InstructorStudentCreateFormValues =
  {
    name: "",
    email: "",
    password: "",
    sectionId: "",
  };

export const initialInstructorStudentCreateActionState: InstructorStudentCreateActionState =
  {
    status: "idle",
    message: null,
    values: initialInstructorStudentCreateFormValues,
    errors: {},
  };

export const initialInstructorStudentEditActionState: InstructorStudentEditActionState =
  {
    status: "idle",
    message: null,
    values: {
      name: "",
      studentNo: "",
    },
    errors: {},
  };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getInstructorStudentCreateFormValues(
  formData: FormData,
): InstructorStudentCreateFormValues {
  return {
    name: String(
      formData.get("name") ?? initialInstructorStudentCreateFormValues.name,
    ),
    email: String(
      formData.get("email") ?? initialInstructorStudentCreateFormValues.email,
    ),
    password: String(
      formData.get("password") ??
        initialInstructorStudentCreateFormValues.password,
    ),
    sectionId: String(
      formData.get("sectionId") ??
        initialInstructorStudentCreateFormValues.sectionId,
    ),
  };
}

export function validateInstructorStudentCreateFormValues(
  values: InstructorStudentCreateFormValues,
):
  | {
      ok: true;
      values: InstructorStudentCreateFormValues;
      data: ValidInstructorStudentCreateInput;
    }
  | {
      ok: false;
      values: InstructorStudentCreateFormValues;
      errors: InstructorStudentCreateFormErrors;
    } {
  const name = normalizeText(values.name);
  const email = values.email.trim().toLowerCase();
  const password = values.password;
  const sectionId = values.sectionId.trim();
  const normalizedValues: InstructorStudentCreateFormValues = {
    name,
    email,
    password,
    sectionId,
  };
  const errors: InstructorStudentCreateFormErrors = {};

  if (!name) {
    errors.name = "Ad soyad zorunludur.";
  }

  if (!email) {
    errors.email = "E-posta zorunludur.";
  } else if (!isEmailValid(email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  if (password.length < INSTRUCTOR_STUDENT_PASSWORD_MIN_LENGTH) {
    errors.password = `Şifre en az ${INSTRUCTOR_STUDENT_PASSWORD_MIN_LENGTH} karakter olmalıdır.`;
  }

  if (!sectionId) {
    errors.sectionId = "Bir ders grubu seçin.";
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
      name,
      email,
      password,
      sectionId,
      enrollmentStatus: "ACTIVE",
    },
  };
}

export function getInstructorStudentEditFormValues(
  formData: FormData,
): InstructorStudentEditFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    studentNo: String(formData.get("studentNo") ?? ""),
  };
}

export function validateInstructorStudentEditFormValues(
  values: InstructorStudentEditFormValues,
):
  | {
      ok: true;
      values: InstructorStudentEditFormValues;
      data: ValidInstructorStudentEditInput;
    }
  | {
      ok: false;
      values: InstructorStudentEditFormValues;
      errors: InstructorStudentEditFormErrors;
    } {
  const name = normalizeText(values.name);
  const studentNo = normalizeText(values.studentNo);
  const normalizedValues: InstructorStudentEditFormValues = {
    name,
    studentNo,
  };
  const errors: InstructorStudentEditFormErrors = {};

  if (!name) {
    errors.name = "Ad soyad zorunludur.";
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
      name,
      studentNo: studentNo || null,
    },
  };
}
