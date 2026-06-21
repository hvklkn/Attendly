"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/constants/routes";
import {
  getInstructorOrganizationId,
  requireInstructorAuthContext,
} from "@/lib/instructor/auth";
import { getInstructorStudentCreateOptionsData } from "@/lib/instructor/queries";
import {
  commitStudentImportCsv,
  previewStudentImportCsv,
} from "@/lib/student-import";
import type {
  StudentImportCommitState,
  StudentImportPreviewState,
} from "@/lib/student-import/types";

function getDefaultSectionId(formData: FormData) {
  return String(formData.get("defaultSectionId") ?? "").trim();
}

async function getAllowedSectionIds(
  authContext: Awaited<ReturnType<typeof requireInstructorAuthContext>>,
) {
  const options = await getInstructorStudentCreateOptionsData(authContext);

  return options.sections.map((section) => section.id);
}

export async function previewInstructorStudentImportAction(
  _previousState: StudentImportPreviewState,
  formData: FormData,
): Promise<StudentImportPreviewState> {
  const authContext = await requireInstructorAuthContext();
  const file = formData.get("csvFile");
  const allowedSectionIds = await getAllowedSectionIds(authContext);

  return previewStudentImportCsv({
    organizationId: getInstructorOrganizationId(authContext),
    actorUserId: authContext.user.id,
    allowedSectionIds,
    file: file instanceof File ? file : null,
    defaultSectionId: getDefaultSectionId(formData),
  });
}

export async function commitInstructorStudentImportAction(
  _previousState: StudentImportCommitState,
  formData: FormData,
): Promise<StudentImportCommitState> {
  const authContext = await requireInstructorAuthContext();
  const allowedSectionIds = await getAllowedSectionIds(authContext);
  const result = await commitStudentImportCsv({
    organizationId: getInstructorOrganizationId(authContext),
    actorUserId: authContext.user.id,
    allowedSectionIds,
    csvText: String(formData.get("csvText") ?? ""),
    defaultSectionId: getDefaultSectionId(formData),
  });

  if (result.status === "success") {
    revalidatePath(routes.instructor.students);
    revalidatePath(routes.instructor.studentImport);
    revalidatePath(routes.instructor.sessionCreate);
    revalidatePath(routes.instructor.sessions);
    revalidatePath(routes.instructor.dashboard);
    revalidatePath(routes.admin.users);
    revalidatePath(routes.admin.sections);
  }

  return result;
}
