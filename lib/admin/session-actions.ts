"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { createAdminAttendanceSession } from "@/lib/admin/session-mutations";
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
