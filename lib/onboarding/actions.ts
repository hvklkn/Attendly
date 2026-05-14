"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { setSessionCookie } from "@/lib/auth/session";
import {
  getRegisterFormValues,
  registerOrganizationAdmin,
  validateRegisterFormValues,
} from "@/lib/onboarding/registration";
import type { RegisterActionState } from "@/lib/onboarding/register-shared";

function getClientIp(headerValue: string | null) {
  return headerValue?.split(",")[0]?.trim() || null;
}

export async function registerOrganizationAdminAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const values = getRegisterFormValues(formData);
  const validation = validateRegisterFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const headerStore = await headers();
  const result = await registerOrganizationAdmin({
    data: validation.data,
    userAgent: headerStore.get("user-agent"),
    ipAddress: getClientIp(
      headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip"),
    ),
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  await setSessionCookie(result.sessionToken);
  redirect(routes.admin.dashboard);
}

