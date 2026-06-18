import type { MembershipRole } from "@/lib/generated/prisma/enums";

export type AdminSectionCreateOptionsData = {
  courses: Array<{
    id: string;
    code: string;
    title: string;
  }>;
  responsibleCandidates: Array<{
    id: string;
    role: MembershipRole;
    user: {
      name: string | null;
      email: string;
    };
  }>;
  studentCandidates: Array<{
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
};

export type AdminSectionCreateFormValues = {
  courseId: string;
  name: string;
  code: string;
  instructorMembershipId: string;
  isActive: string;
};

export type AdminSectionCreateFormField = keyof AdminSectionCreateFormValues;

export type AdminSectionCreateFormErrors = Partial<
  Record<AdminSectionCreateFormField, string>
>;

export type AdminSectionCreateActionState = {
  status: "idle" | "error";
  message: string | null;
  values: AdminSectionCreateFormValues;
  errors: AdminSectionCreateFormErrors;
};

export type ValidAdminSectionCreateInput = {
  courseId: string;
  name: string;
  code: string | null;
  instructorMembershipId: string;
  isActive: boolean;
};

export const initialAdminSectionCreateFormValues: AdminSectionCreateFormValues =
  {
    courseId: "",
    name: "",
    code: "",
    instructorMembershipId: "",
    isActive: "on",
  };

export const initialAdminSectionCreateActionState: AdminSectionCreateActionState =
  {
    status: "idle",
    message: null,
    values: initialAdminSectionCreateFormValues,
    errors: {},
  };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

export function getAdminSectionCreateFormValues(
  formData: FormData,
): AdminSectionCreateFormValues {
  return {
    courseId: String(
      formData.get("courseId") ??
        initialAdminSectionCreateFormValues.courseId,
    ),
    name: String(
      formData.get("name") ?? initialAdminSectionCreateFormValues.name,
    ),
    code: String(
      formData.get("code") ?? initialAdminSectionCreateFormValues.code,
    ),
    instructorMembershipId: String(
      formData.get("instructorMembershipId") ??
        initialAdminSectionCreateFormValues.instructorMembershipId,
    ),
    isActive: formData.get("isActive") === "on" ? "on" : "",
  };
}

export function validateAdminSectionCreateFormValues(
  values: AdminSectionCreateFormValues,
):
  | {
      ok: true;
      values: AdminSectionCreateFormValues;
      data: ValidAdminSectionCreateInput;
    }
  | {
      ok: false;
      values: AdminSectionCreateFormValues;
      errors: AdminSectionCreateFormErrors;
    } {
  const courseId = values.courseId.trim();
  const name = normalizeText(values.name);
  const code = normalizeCode(values.code);
  const instructorMembershipId = values.instructorMembershipId.trim();
  const isActive = values.isActive === "on" ? "on" : "";
  const normalizedValues: AdminSectionCreateFormValues = {
    courseId,
    name,
    code,
    instructorMembershipId,
    isActive,
  };
  const errors: AdminSectionCreateFormErrors = {};

  if (!courseId) {
    errors.courseId = "Ders / kurs seçilmelidir.";
  }

  if (!name) {
    errors.name = "Ders grubu adı zorunludur.";
  }

  if (!instructorMembershipId) {
    errors.instructorMembershipId = "Sorumlu kişi seçilmelidir.";
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
      courseId,
      name,
      code: code || null,
      instructorMembershipId,
      isActive: isActive === "on",
    },
  };
}
