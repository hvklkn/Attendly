"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminRoomCreateFormValues,
  type AdminRoomCreateActionState,
  validateAdminRoomCreateFormValues,
} from "@/lib/admin/room-create";
import { createAdminRoom } from "@/lib/admin/room-mutations";

export async function createAdminRoomAction(
  _previousState: AdminRoomCreateActionState,
  formData: FormData,
): Promise<AdminRoomCreateActionState> {
  const values = getAdminRoomCreateFormValues(formData);
  const validation = validateAdminRoomCreateFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await createAdminRoom(authContext, validation.data);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.rooms);
  revalidatePath(routes.admin.roomCreate);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);
  redirect(`${routes.admin.rooms}?created=1`);
}
