import { ArrowLeft, FileUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudentCsvImportForm } from "@/components/student-import/StudentCsvImportForm";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorStudentCreateOptionsData } from "@/lib/instructor/queries";
import {
  commitInstructorStudentImportAction,
  previewInstructorStudentImportAction,
} from "@/lib/instructor/student-import-actions";

export default async function InstructorStudentImportPage() {
  const authContext = await requireInstructorAuthContext();
  const options = await getInstructorStudentCreateOptionsData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="CSV ile Öğrenci İçe Aktar"
        description="Öğrencileri CSV dosyasıyla oluşturun ve kurumunuzdaki şubelere toplu olarak atayın."
      >
        <ButtonLink
          href={routes.instructor.students}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrencilere Dön
        </ButtonLink>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-950 text-white">
          <FileUp className="h-4 w-4" aria-hidden="true" />
        </div>
      </PageHeader>

      <StudentCsvImportForm
        backHref={routes.instructor.students}
        sections={options.sections.map((section) => ({
          id: section.id,
          code: section.code,
          name: section.name,
          courseCode: section.course.code,
          courseTitle: section.course.title,
          activeEnrollmentCount: section._count.enrollments,
        }))}
        previewAction={previewInstructorStudentImportAction}
        commitAction={commitInstructorStudentImportAction}
      />
    </>
  );
}
