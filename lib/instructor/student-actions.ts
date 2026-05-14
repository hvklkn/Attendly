"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  getInstructorStudentCreateFormValues,
  type InstructorStudentCreateActionState,
  validateInstructorStudentCreateFormValues,
} from "@/lib/instructor/student-create";
import { createInstructorStudentEnrollment } from "@/lib/instructor/student-mutations";

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
