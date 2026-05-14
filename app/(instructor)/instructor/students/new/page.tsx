import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorStudentCreateOptionsData } from "@/lib/instructor/queries";
import { InstructorCreateStudentForm } from "@/app/(instructor)/instructor/students/new/InstructorCreateStudentForm";

export default async function InstructorCreateStudentPage() {
  const authContext = await requireInstructorAuthContext();
  const options = await getInstructorStudentCreateOptionsData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğrenci Ekle"
        description="Yeni öğrenciyi yalnızca öğretmeni olduğunuz ders grubuna kaydedin."
      >
        <ButtonLink
          href={routes.instructor.students}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="Ders grubu kapsamlı" tone="info" />
      </PageHeader>

      <InstructorCreateStudentForm options={options} />
    </>
  );
}
