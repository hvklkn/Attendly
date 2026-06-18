import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorSessionCreateOptionsData } from "@/lib/instructor/queries";
import { createInstructorSessionDefaultValues } from "@/lib/instructor/session-create";
import { InstructorCreateSessionForm } from "./InstructorCreateSessionForm";

export default async function InstructorCreateSessionPage() {
  const authContext = await requireInstructorAuthContext();
  const options = await getInstructorSessionCreateOptionsData(authContext);
  const defaultValues = createInstructorSessionDefaultValues();

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Yeni Yoklama Oluştur"
        description="Kendi ders grubunuz için aktif, konum doğrulamalı bir yoklama oturumu oluşturun."
      >
        <ButtonLink
          href={routes.instructor.sessions}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="ACTIVE" tone="success" />
      </PageHeader>

      <InstructorCreateSessionForm
        options={options}
        defaultValues={defaultValues}
      />
    </>
  );
}
