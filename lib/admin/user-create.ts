import type { MembershipRole, UserStatus } from "@/lib/generated/prisma/enums";

export const ADMIN_CREATABLE_USER_ROLES = [
  "ORG_ADMIN",
  "INSTRUCTOR",
  "STUDENT",
] as const satisfies readonly MembershipRole[];

export type AdminCreatableUserRole =
  (typeof ADMIN_CREATABLE_USER_ROLES)[number];

export type AdminCreateUserFormField =
  | "name"
  | "email"
  | "role"
  | "password"
  | "isActive"
  | "sectionIds";

export type AdminCreateUserFormValues = {
  name: string;
  email: string;
  role: string;
  password: string;
  isActive: string;
  sectionIds: string[];
};

export type AdminCreateUserFormErrors = Partial<
  Record<AdminCreateUserFormField, string>
>;

export type AdminCreateUserActionState = {
  status: "idle" | "error";
  message: string | null;
  values: AdminCreateUserFormValues;
  errors: AdminCreateUserFormErrors;
};

export type ValidAdminCreateUserInput = {
  name: string;
  email: string;
  role: AdminCreatableUserRole;
  password: string;
  status: Extract<UserStatus, "ACTIVE" | "INVITED">;
  sectionIds: string[];
};

export type AdminUserCreateOptionsData = {
  sections: Array<{
    id: string;
    name: string;
    code: string | null;
    course: {
      code: string;
      title: string;
    };
    instructorMembership: {
      user: {
        name: string | null;
        email: string;
      };
    } | null;
    _count: {
      enrollments: number;
    };
  }>;
};

export const initialAdminCreateUserFormValues: AdminCreateUserFormValues = {
  name: "",
  email: "",
  role: "INSTRUCTOR",
  password: "",
  isActive: "on",
  sectionIds: [],
};

export const initialAdminCreateUserActionState: AdminCreateUserActionState = {
  status: "idle",
  message: null,
  values: initialAdminCreateUserFormValues,
  errors: {},
};

const PASSWORD_MIN_LENGTH = 8;

function isCreatableRole(role: string): role is AdminCreatableUserRole {
  return ADMIN_CREATABLE_USER_ROLES.some(
    (creatableRole) => creatableRole === role,
  );
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getAdminCreateUserFormValues(
  formData: FormData,
): AdminCreateUserFormValues {
  return {
    name: String(formData.get("name") ?? initialAdminCreateUserFormValues.name),
    email: String(
      formData.get("email") ?? initialAdminCreateUserFormValues.email,
    ),
    role: String(formData.get("role") ?? initialAdminCreateUserFormValues.role),
    password: String(
      formData.get("password") ?? initialAdminCreateUserFormValues.password,
    ),
    isActive: formData.get("isActive") === "on" ? "on" : "",
    sectionIds: formData
      .getAll("sectionIds")
      .filter((value): value is string => typeof value === "string"),
  };
}

export function validateAdminCreateUserFormValues(
  values: AdminCreateUserFormValues,
):
  | {
      ok: true;
      values: AdminCreateUserFormValues;
      data: ValidAdminCreateUserInput;
    }
  | {
      ok: false;
      values: AdminCreateUserFormValues;
      errors: AdminCreateUserFormErrors;
    } {
  const name = normalizeText(values.name);
  const email = values.email.trim().toLowerCase();
  const role = values.role.trim();
  const password = values.password;
  const isActive = values.isActive === "on" ? "on" : "";
  const sectionIds = Array.from(
    new Set(values.sectionIds.map((sectionId) => sectionId.trim())),
  ).filter(Boolean);
  const normalizedValues: AdminCreateUserFormValues = {
    name,
    email,
    role,
    password,
    isActive,
    sectionIds,
  };
  const errors: AdminCreateUserFormErrors = {};

  if (!name) {
    errors.name = "Ad soyad zorunludur.";
  }

  if (!email) {
    errors.email = "E-posta zorunludur.";
  } else if (!isEmailValid(email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  if (!isCreatableRole(role)) {
    errors.role = "Bu rol için yetkiniz yok.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;
  }

  if (Object.keys(errors).length > 0 || !isCreatableRole(role)) {
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
      role,
      password,
      status: isActive ? "ACTIVE" : "INVITED",
      sectionIds: role === "STUDENT" ? sectionIds : [],
    },
  };
}
