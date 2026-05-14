"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminCreateUserFormValues,
  type AdminCreateUserActionState,
  validateAdminCreateUserFormValues,
} from "@/lib/admin/user-create";
import { createAdminManagedUser } from "@/lib/admin/user-mutations";

export async function createAdminManagedUserAction(
  _previousState: AdminCreateUserActionState,
  formData: FormData,
): Promise<AdminCreateUserActionState> {
  const values = getAdminCreateUserFormValues(formData);
  const validation = validateAdminCreateUserFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await createAdminManagedUser(authContext, validation.data);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.users);
  revalidatePath(routes.admin.sections);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.dashboard);
  redirect(routes.admin.users);
}
