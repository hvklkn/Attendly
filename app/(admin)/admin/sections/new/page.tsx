import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminSectionCreateOptionsData } from "@/lib/admin/queries";
import { AdminCreateSectionForm } from "@/app/(admin)/admin/sections/new/AdminCreateSectionForm";

export default async function AdminCreateSectionPage() {
  const authContext = await requireAdminAuthContext();
  const options = await getAdminSectionCreateOptionsData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Ders Grubu Oluştur"
        description="Ders / kurs, ders grubu ve öğretmen atamasını tanımlayın."
      >
        <ButtonLink
          href={routes.admin.sections}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="Kurum kapsamlı" tone="info" />
      </PageHeader>

      <AdminCreateSectionForm options={options} />
    </>
  );
}
