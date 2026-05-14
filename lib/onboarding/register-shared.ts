export const organizationTypeOptions = [
  { value: "SCHOOL", label: "Okul" },
  { value: "UNIVERSITY", label: "Üniversite" },
  { value: "TRAINING_CENTER", label: "Kurs Merkezi" },
  { value: "COMPANY", label: "Şirket" },
  { value: "OTHER", label: "Diğer" },
] as const;

export type OrganizationType = (typeof organizationTypeOptions)[number]["value"];

export type RegisterFormField =
  | "organizationName"
  | "organizationType"
  | "city"
  | "slug"
  | "adminName"
  | "email"
  | "password"
  | "passwordConfirm";

export type RegisterFormValues = Record<RegisterFormField, string>;

export type RegisterFormErrors = Partial<Record<RegisterFormField, string>>;

export type RegisterActionState = {
  status: "idle" | "error";
  message: string | null;
  values: RegisterFormValues;
  errors: RegisterFormErrors;
};

export const initialRegisterFormValues: RegisterFormValues = {
  organizationName: "",
  organizationType: "",
  city: "",
  slug: "",
  adminName: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

export const initialRegisterActionState: RegisterActionState = {
  status: "idle",
  message: null,
  values: initialRegisterFormValues,
  errors: {},
};

