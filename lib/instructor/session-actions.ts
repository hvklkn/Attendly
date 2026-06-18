"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  issueInstructorSessionQrToken,
  startInstructorAttendanceSession,
} from "@/lib/instructor/session-mutations";
import type { IssueQrTokenActionState } from "@/lib/qr-ui";

export async function issueInstructorSessionQrTokenAction(
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

  const authContext = await requireInstructorAuthContext();
  const result = await issueInstructorSessionQrToken(authContext, sessionId);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      issuedToken: null,
    };
  }

  revalidatePath(`/instructor/sessions/${result.attendanceSessionId}`);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);

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

export async function startInstructorSessionAction(formData: FormData) {
  const sessionIdValue = formData.get("sessionId");
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : "";
  const targetPath = sessionId.trim()
    ? `/instructor/sessions/${sessionId.trim()}`
    : routes.instructor.sessions;

  if (!sessionId.trim()) {
    redirect(`${targetPath}?startError=1`);
  }

  const authContext = await requireInstructorAuthContext();
  const result = await startInstructorAttendanceSession(authContext, sessionId);

  if (!result.ok) {
    redirect(`${targetPath}?startError=1`);
  }

  revalidatePath(`/instructor/sessions/${result.sessionId}`);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);
  revalidatePath(`/admin/sessions/${result.sessionId}`);
  revalidatePath(routes.admin.sessions);
  revalidatePath(routes.admin.dashboard);
  redirect(`/instructor/sessions/${result.sessionId}?started=1`);
}
