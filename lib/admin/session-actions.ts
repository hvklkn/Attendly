"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import type { IssueQrTokenActionState } from "@/lib/admin/session-qr";
import {
  createAdminAttendanceSession,
  issueAdminSessionQrToken,
} from "@/lib/admin/session-mutations";
import {
  getCreateSessionFormValues,
  type CreateSessionActionState,
  validateCreateSessionFormValues,
} from "@/lib/admin/session-create";

export async function createAdminSessionAction(
  _previousState: CreateSessionActionState,
  formData: FormData,
): Promise<CreateSessionActionState> {
  const values = getCreateSessionFormValues(formData);
  const validation = validateCreateSessionFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await createAdminAttendanceSession(
    authContext,
    validation.data,
  );

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.sessions);
  revalidatePath(routes.admin.dashboard);
  redirect(`/admin/sessions/${result.sessionId}`);
}

export async function issueAdminSessionQrTokenAction(
  _previousState: IssueQrTokenActionState,
  formData: FormData,
): Promise<IssueQrTokenActionState> {
  const sessionIdValue = formData.get("sessionId");
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : "";

  if (!sessionId.trim()) {
    return {
      status: "error",
      message: "Select a valid attendance session before issuing a QR token.",
      issuedToken: null,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await issueAdminSessionQrToken(authContext, sessionId);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      issuedToken: null,
    };
  }

  revalidatePath(`/admin/sessions/${result.attendanceSessionId}`);
  revalidatePath(routes.admin.sessions);

  return {
    status: "success",
    message: "QR token issued. The raw scan value is shown once below.",
    issuedToken: {
      id: result.tokenId,
      rawToken: result.rawToken,
      scanUrl: result.scanUrl,
      expiresAt: result.expiresAt.toISOString(),
      createdAt: result.createdAt.toISOString(),
      revokedAt: null,
      revokedPreviousCount: result.revokedPreviousCount,
    },
  };
}
