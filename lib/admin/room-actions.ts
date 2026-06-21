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
import {
  createAdminRoom,
  setAdminRoomActive,
  updateAdminRoom,
} from "@/lib/admin/room-mutations";

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

export async function updateAdminRoomAction(
  _previousState: AdminRoomCreateActionState,
  formData: FormData,
): Promise<AdminRoomCreateActionState> {
  const roomId = String(formData.get("roomId") ?? "");
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
  const result = await updateAdminRoom(authContext, roomId, validation.data);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.rooms);
  revalidatePath(`/admin/rooms/${result.roomId}/edit`);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);
  redirect(`${routes.admin.rooms}?updated=1`);
}

async function setAdminRoomActiveAction(formData: FormData, isActive: boolean) {
  const roomId = String(formData.get("roomId") ?? "");
  const authContext = await requireAdminAuthContext();
  const result = await setAdminRoomActive(authContext, roomId, isActive);

  revalidatePath(routes.admin.rooms);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);

  if (!result.ok) {
    const searchParams = new URLSearchParams({
      error: result.message,
    });

    redirect(`${routes.admin.rooms}?${searchParams.toString()}`);
  }

  redirect(`${routes.admin.rooms}?${isActive ? "reactivated" : "deactivated"}=1`);
}

export async function deactivateAdminRoomAction(formData: FormData) {
  return setAdminRoomActiveAction(formData, false);
}

export async function reactivateAdminRoomAction(formData: FormData) {
  return setAdminRoomActiveAction(formData, true);
}
