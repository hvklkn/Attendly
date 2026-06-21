"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
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

export async function previewAdminStudentImportAction(
  _previousState: StudentImportPreviewState,
  formData: FormData,
): Promise<StudentImportPreviewState> {
  const authContext = await requireAdminAuthContext();
  const file = formData.get("csvFile");

  return previewStudentImportCsv({
    organizationId: getAdminOrganizationId(authContext),
    actorUserId: authContext.user.id,
    file: file instanceof File ? file : null,
    defaultSectionId: getDefaultSectionId(formData),
  });
}

export async function commitAdminStudentImportAction(
  _previousState: StudentImportCommitState,
  formData: FormData,
): Promise<StudentImportCommitState> {
  const authContext = await requireAdminAuthContext();
  const result = await commitStudentImportCsv({
    organizationId: getAdminOrganizationId(authContext),
    actorUserId: authContext.user.id,
    csvText: String(formData.get("csvText") ?? ""),
    defaultSectionId: getDefaultSectionId(formData),
  });

  if (result.status === "success") {
    revalidatePath(routes.admin.users);
    revalidatePath(routes.admin.studentImport);
    revalidatePath(routes.admin.sections);
    revalidatePath(routes.admin.dashboard);
    revalidatePath(routes.instructor.students);
    revalidatePath(routes.instructor.dashboard);
    revalidatePath(routes.instructor.sessionCreate);
  }

  return result;
}
