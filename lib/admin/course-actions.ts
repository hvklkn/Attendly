"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminCourseCreateFormValues,
  type AdminCourseCreateActionState,
  validateAdminCourseCreateFormValues,
} from "@/lib/admin/course-create";
import { createAdminCourse } from "@/lib/admin/course-mutations";

export async function createAdminCourseAction(
  _previousState: AdminCourseCreateActionState,
  formData: FormData,
): Promise<AdminCourseCreateActionState> {
  const values = getAdminCourseCreateFormValues(formData);
  const validation = validateAdminCourseCreateFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await createAdminCourse(authContext, validation.data);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.courses);
  revalidatePath(routes.admin.courseCreate);
  revalidatePath(routes.admin.sectionCreate);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);
  redirect(`${routes.admin.courses}?created=1`);
}
