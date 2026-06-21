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
import {
  createAdminCourse,
  setAdminCourseActive,
  updateAdminCourse,
} from "@/lib/admin/course-mutations";

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

export async function updateAdminCourseAction(
  _previousState: AdminCourseCreateActionState,
  formData: FormData,
): Promise<AdminCourseCreateActionState> {
  const courseId = String(formData.get("courseId") ?? "");
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
  const result = await updateAdminCourse(
    authContext,
    courseId,
    validation.data,
  );

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.courses);
  revalidatePath(`/admin/courses/${result.courseId}/edit`);
  revalidatePath(routes.admin.sectionCreate);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);
  redirect(`${routes.admin.courses}?updated=1`);
}

async function setAdminCourseActiveAction(formData: FormData, isActive: boolean) {
  const courseId = String(formData.get("courseId") ?? "");
  const authContext = await requireAdminAuthContext();
  const result = await setAdminCourseActive(authContext, courseId, isActive);

  revalidatePath(routes.admin.courses);
  revalidatePath(routes.admin.sectionCreate);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);

  if (!result.ok) {
    const searchParams = new URLSearchParams({
      error: result.message,
    });

    redirect(`${routes.admin.courses}?${searchParams.toString()}`);
  }

  redirect(`${routes.admin.courses}?${isActive ? "reactivated" : "deactivated"}=1`);
}

export async function deactivateAdminCourseAction(formData: FormData) {
  return setAdminCourseActiveAction(formData, false);
}

export async function reactivateAdminCourseAction(formData: FormData) {
  return setAdminCourseActiveAction(formData, true);
}
