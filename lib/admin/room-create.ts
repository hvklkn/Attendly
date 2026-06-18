export type AdminRoomCreateFormValues = {
  name: string;
  code: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
  isActive: string;
};

export type AdminRoomCreateFormField = keyof AdminRoomCreateFormValues;

export type AdminRoomCreateFormErrors = Partial<
  Record<AdminRoomCreateFormField, string>
>;

export type AdminRoomCreateActionState = {
  status: "idle" | "error";
  message: string | null;
  values: AdminRoomCreateFormValues;
  errors: AdminRoomCreateFormErrors;
};

export type ValidAdminRoomCreateInput = {
  name: string;
  code: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  allowedRadiusMeters: number | null;
  isActive: boolean;
};

export const initialAdminRoomCreateFormValues: AdminRoomCreateFormValues = {
  name: "",
  code: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  allowedRadiusMeters: "100",
  isActive: "on",
};

export const initialAdminRoomCreateActionState: AdminRoomCreateActionState = {
  status: "idle",
  message: null,
  values: initialAdminRoomCreateFormValues,
  errors: {},
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue.replace(",", "."));

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

export function getAdminRoomCreateFormValues(
  formData: FormData,
): AdminRoomCreateFormValues {
  return {
    name: String(formData.get("name") ?? initialAdminRoomCreateFormValues.name),
    code: String(formData.get("code") ?? initialAdminRoomCreateFormValues.code),
    description: String(
      formData.get("description") ??
        initialAdminRoomCreateFormValues.description,
    ),
    address: String(
      formData.get("address") ?? initialAdminRoomCreateFormValues.address,
    ),
    latitude: String(
      formData.get("latitude") ?? initialAdminRoomCreateFormValues.latitude,
    ),
    longitude: String(
      formData.get("longitude") ?? initialAdminRoomCreateFormValues.longitude,
    ),
    allowedRadiusMeters: String(
      formData.get("allowedRadiusMeters") ??
        initialAdminRoomCreateFormValues.allowedRadiusMeters,
    ),
    isActive: formData.get("isActive") === "on" ? "on" : "",
  };
}

export function validateAdminRoomCreateFormValues(
  values: AdminRoomCreateFormValues,
):
  | {
      ok: true;
      values: AdminRoomCreateFormValues;
      data: ValidAdminRoomCreateInput;
    }
  | {
      ok: false;
      values: AdminRoomCreateFormValues;
      errors: AdminRoomCreateFormErrors;
    } {
  const name = normalizeText(values.name);
  const code = normalizeCode(values.code);
  const description = normalizeText(values.description);
  const address = normalizeText(values.address);
  const latitude = parseOptionalNumber(values.latitude);
  const longitude = parseOptionalNumber(values.longitude);
  const allowedRadiusMeters = parseOptionalNumber(values.allowedRadiusMeters);
  const isActive = values.isActive === "on" ? "on" : "";
  const normalizedValues: AdminRoomCreateFormValues = {
    name,
    code,
    description,
    address,
    latitude: values.latitude.trim(),
    longitude: values.longitude.trim(),
    allowedRadiusMeters: values.allowedRadiusMeters.trim(),
    isActive,
  };
  const errors: AdminRoomCreateFormErrors = {};

  if (!name) {
    errors.name = "Oda adı zorunludur.";
  }

  if (Number.isNaN(latitude)) {
    errors.latitude = "Geçerli bir latitude girin.";
  } else if (latitude !== null && (latitude < -90 || latitude > 90)) {
    errors.latitude = "Latitude -90 ile 90 arasında olmalıdır.";
  }

  if (Number.isNaN(longitude)) {
    errors.longitude = "Geçerli bir longitude girin.";
  } else if (longitude !== null && (longitude < -180 || longitude > 180)) {
    errors.longitude = "Longitude -180 ile 180 arasında olmalıdır.";
  }

  if ((latitude === null) !== (longitude === null)) {
    errors.latitude = errors.latitude ?? "Latitude ve longitude birlikte girilmelidir.";
    errors.longitude =
      errors.longitude ?? "Latitude ve longitude birlikte girilmelidir.";
  }

  if (Number.isNaN(allowedRadiusMeters)) {
    errors.allowedRadiusMeters = "Geçerli bir yarıçap girin.";
  } else if (
    allowedRadiusMeters !== null &&
    (allowedRadiusMeters < 10 || allowedRadiusMeters > 1000)
  ) {
    errors.allowedRadiusMeters = "Yarıçap 10 ile 1000 metre arasında olmalıdır.";
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
      code: code || null,
      description: description || null,
      address: address || null,
      latitude,
      longitude,
      allowedRadiusMeters:
        allowedRadiusMeters === null ? null : Math.round(allowedRadiusMeters),
      isActive: isActive === "on",
    },
  };
}
