"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import type { IssueQrTokenActionState } from "@/lib/admin/session-qr";
import {
  createAdminAttendanceSession,
  issueAdminSessionQrToken,
  startAdminAttendanceSession,
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
      message: "Lütfen işaretli alanları düzeltin.",
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
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);
  redirect(`/admin/sessions/${result.sessionId}?created=1`);
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
      message: "QR oluşturmak için geçerli bir yoklama oturumu seçin.",
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
    message: "QR oluşturuldu. Ham okutma değeri yalnızca burada gösterilir.",
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

export async function startAdminSessionAction(formData: FormData) {
  const sessionIdValue = formData.get("sessionId");
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : "";
  const targetPath = sessionId.trim()
    ? `/admin/sessions/${sessionId.trim()}`
    : routes.admin.sessions;

  if (!sessionId.trim()) {
    redirect(`${targetPath}?startError=1`);
  }

  const authContext = await requireAdminAuthContext();
  const result = await startAdminAttendanceSession(authContext, sessionId);

  if (!result.ok) {
    redirect(`${targetPath}?startError=1`);
  }

  revalidatePath(`/admin/sessions/${result.sessionId}`);
  revalidatePath(routes.admin.sessions);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(`/instructor/sessions/${result.sessionId}`);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);
  redirect(`/admin/sessions/${result.sessionId}?started=1`);
}
