"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminCreateUserFormValues,
  getAdminEditUserFormValues,
  type AdminCreateUserActionState,
  type AdminEditUserActionState,
  validateAdminCreateUserFormValues,
  validateAdminEditUserFormValues,
} from "@/lib/admin/user-create";
import {
  createAdminManagedUser,
  setAdminStudentEnrollmentStatus,
  updateAdminManagedUser,
} from "@/lib/admin/user-mutations";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";

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

export async function updateAdminManagedUserAction(
  _previousState: AdminEditUserActionState,
  formData: FormData,
): Promise<AdminEditUserActionState> {
  const membershipId = String(formData.get("membershipId") ?? "");
  const values = getAdminEditUserFormValues(formData);
  const validation = validateAdminEditUserFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireAdminAuthContext();
  const result = await updateAdminManagedUser(
    authContext,
    membershipId,
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

  revalidatePath(routes.admin.users);
  revalidatePath(`/admin/users/${result.membershipId}/edit`);
  revalidatePath(routes.admin.sections);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.dashboard);
  redirect(`${routes.admin.users}?updated=1`);
}

async function setAdminEnrollmentStatusAction(
  formData: FormData,
  status: Extract<EnrollmentStatus, "ACTIVE" | "INACTIVE">,
) {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const authContext = await requireAdminAuthContext();
  const result = await setAdminStudentEnrollmentStatus(
    authContext,
    enrollmentId,
    status,
  );

  revalidatePath(routes.admin.users);
  revalidatePath(routes.admin.sections);
  revalidatePath(routes.admin.dashboard);
  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.sessionCreate);
  revalidatePath(routes.instructor.dashboard);

  if (!result.ok) {
    redirect(`${routes.admin.users}?enrollmentError=1`);
  }

  redirect(
    `${routes.admin.users}?${
      status === EnrollmentStatus.ACTIVE ? "reactivated" : "deactivated"
    }=1`,
  );
}

export async function deactivateAdminEnrollmentAction(formData: FormData) {
  return setAdminEnrollmentStatusAction(formData, EnrollmentStatus.INACTIVE);
}

export async function reactivateAdminEnrollmentAction(formData: FormData) {
  return setAdminEnrollmentStatusAction(formData, EnrollmentStatus.ACTIVE);
}
