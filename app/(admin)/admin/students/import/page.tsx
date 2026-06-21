import { ArrowLeft, FileUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudentCsvImportForm } from "@/components/student-import/StudentCsvImportForm";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
import {
  commitAdminStudentImportAction,
  previewAdminStudentImportAction,
} from "@/lib/admin/student-import-actions";
import { getStudentImportOptions } from "@/lib/student-import";

export default async function AdminStudentImportPage() {
  const authContext = await requireAdminAuthContext();
  const options = await getStudentImportOptions(
    getAdminOrganizationId(authContext),
  );

  return (
    <>
      <PageHeader
        eyebrow="Toplu öğrenci yükleme"
        title="CSV ile Öğrenci İçe Aktar"
        description="Öğrencileri CSV dosyasıyla oluşturun ve kurum içindeki şubelere toplu olarak atayın."
      >
        <ButtonLink
          href={routes.admin.users}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Kullanıcılara Dön
        </ButtonLink>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-950 text-white">
          <FileUp className="h-4 w-4" aria-hidden="true" />
        </div>
      </PageHeader>

      <StudentCsvImportForm
        backHref={routes.admin.users}
        sections={options.sections}
        previewAction={previewAdminStudentImportAction}
        commitAction={commitAdminStudentImportAction}
      />
    </>
  );
}
