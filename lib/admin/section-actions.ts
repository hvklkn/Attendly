"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminSectionCreateFormValues,
  type AdminSectionCreateActionState,
  validateAdminSectionCreateFormValues,
} from "@/lib/admin/section-create";
import {
  assignAdminSectionInstructor,
  createAdminSection,
} from "@/lib/admin/section-mutations";

export async function createAdminSectionAction(
  _previousState: AdminSectionCreateActionState,
  formData: FormData,
): Promise<AdminSectionCreateActionState> {
  const values = getAdminSectionCreateFormValues(formData);
  const validation = validateAdminSectionCreateFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await createAdminSection(authContext, validation.data);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      values: validation.values,
      errors: result.errors ?? {},
    };
  }

  revalidatePath(routes.admin.sections);
  revalidatePath(routes.admin.courses);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(routes.instructor.dashboard);
  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.studentCreate);
  redirect(`${routes.admin.sections}?created=1`);
}

export async function assignAdminSectionInstructorAction(formData: FormData) {
  const sectionId = String(formData.get("sectionId") ?? "");
  const instructorMembershipId = String(
    formData.get("instructorMembershipId") ?? "",
  );
  const authContext = await requireAdminAuthContext();
  const result = await assignAdminSectionInstructor(authContext, {
    sectionId,
    instructorMembershipId,
  });

  revalidatePath(routes.admin.sections);
  revalidatePath(routes.admin.courses);
  revalidatePath(routes.admin.sessionCreate);
  revalidatePath(routes.admin.sessions);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);
  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.studentCreate);

  if (!result.ok) {
    const searchParams = new URLSearchParams({
      error: result.message,
    });

    redirect(`${routes.admin.sections}?${searchParams.toString()}`);
  }

  redirect(`${routes.admin.sections}?assigned=1`);
}
