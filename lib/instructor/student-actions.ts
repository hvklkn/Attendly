"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  getInstructorStudentEditFormValues,
  getInstructorStudentCreateFormValues,
  type InstructorStudentEditActionState,
  type InstructorStudentCreateActionState,
  validateInstructorStudentEditFormValues,
  validateInstructorStudentCreateFormValues,
} from "@/lib/instructor/student-create";
import {
  assignInstructorStudentToSection,
  createInstructorStudentEnrollment,
  deactivateInstructorEnrollment,
  reactivateInstructorEnrollment,
  updateInstructorStudent,
} from "@/lib/instructor/student-mutations";

export async function createInstructorStudentAction(
  _previousState: InstructorStudentCreateActionState,
  formData: FormData,
): Promise<InstructorStudentCreateActionState> {
  const values = getInstructorStudentCreateFormValues(formData);
  const validation = validateInstructorStudentCreateFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireInstructorAuthContext();
  const result = await createInstructorStudentEnrollment(
    authContext,
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

  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.dashboard);
  revalidatePath(routes.instructor.sessions);
  redirect(`${routes.instructor.students}?created=1`);
}

export async function updateInstructorStudentAction(
  _previousState: InstructorStudentEditActionState,
  formData: FormData,
): Promise<InstructorStudentEditActionState> {
  const studentMembershipId = String(formData.get("studentMembershipId") ?? "");
  const values = getInstructorStudentEditFormValues(formData);
  const validation = validateInstructorStudentEditFormValues(values);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Lütfen işaretli alanları düzeltin.",
      values: validation.values,
      errors: validation.errors,
    };
  }

  const authContext = await requireInstructorAuthContext();
  const result = await updateInstructorStudent(
    authContext,
    studentMembershipId,
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

  revalidatePath(routes.instructor.students);
  revalidatePath(`/instructor/students/${result.membershipId}/edit`);
  revalidatePath(routes.instructor.dashboard);
  revalidatePath(routes.instructor.sessions);
  redirect(`${routes.instructor.students}?updated=1`);
}

export async function assignInstructorStudentToSectionAction(
  formData: FormData,
) {
  const studentMembershipId = String(formData.get("studentMembershipId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const authContext = await requireInstructorAuthContext();
  const result = await assignInstructorStudentToSection(authContext, {
    studentMembershipId,
    sectionId,
  });

  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.sessionCreate);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);

  if (!result.ok) {
    redirect(`${routes.instructor.students}?assignError=1`);
  }

  redirect(`${routes.instructor.students}?assigned=1`);
}

export async function deactivateInstructorEnrollmentAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const authContext = await requireInstructorAuthContext();
  const result = await deactivateInstructorEnrollment(authContext, enrollmentId);

  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.sessionCreate);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);

  if (!result.ok) {
    redirect(`${routes.instructor.students}?deactivateError=1`);
  }

  redirect(`${routes.instructor.students}?deactivated=1`);
}

export async function reactivateInstructorEnrollmentAction(formData: FormData) {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const authContext = await requireInstructorAuthContext();
  const result = await reactivateInstructorEnrollment(authContext, enrollmentId);

  revalidatePath(routes.instructor.students);
  revalidatePath(routes.instructor.sessionCreate);
  revalidatePath(routes.instructor.sessions);
  revalidatePath(routes.instructor.dashboard);

  if (!result.ok) {
    redirect(`${routes.instructor.students}?reactivateError=1`);
  }

  redirect(`${routes.instructor.students}?reactivated=1`);
}
