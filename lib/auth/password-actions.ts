"use server";

import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAuth } from "@/lib/auth/guards";
import {
  changeOwnPassword,
  completePasswordReset,
  requestPasswordReset,
} from "@/lib/auth/password-management";

export type ChangePasswordActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialChangePasswordActionState: ChangePasswordActionState = {
  status: "idle",
  message: null,
};

export async function changeOwnPasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const authContext = await requireAuth();
  const result = await changeOwnPassword({
    userId: authContext.user.id,
    organizationId: authContext.activeOrganization.id,
    actorUserId: authContext.user.id,
    currentDeviceSessionId: authContext.deviceSession.id,
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    newPasswordConfirm: String(formData.get("newPasswordConfirm") ?? ""),
  });

  return {
    status: result.ok ? "success" : "error",
    message: result.message,
  };
}

export type ForgotPasswordActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  email: string;
};

export const initialForgotPasswordActionState: ForgotPasswordActionState = {
  status: "idle",
  message: null,
  email: "",
};

export async function requestPasswordResetAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "");
  const result = await requestPasswordReset({
    email,
  });

  return {
    status: result.ok ? "success" : "error",
    message: result.message,
    email,
  };
}

export type ResetPasswordActionState = {
  status: "idle" | "error";
  message: string | null;
};

export const initialResetPasswordActionState: ResetPasswordActionState = {
  status: "idle",
  message: null,
};

export async function completePasswordResetAction(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const result = await completePasswordReset({
    token: String(formData.get("token") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    newPasswordConfirm: String(formData.get("newPasswordConfirm") ?? ""),
  });

  if (result.ok) {
    redirect(`${routes.public.login}?reset=1`);
  }

  return {
    status: "error",
    message: result.message,
  };
}
