import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminSessionCreateOptionsData } from "@/lib/admin/queries";
import { AdminCreateSessionForm } from "@/app/(admin)/admin/sessions/new/AdminCreateSessionForm";

export default async function AdminCreateSessionPage() {
  const authContext = await requireAdminAuthContext();
  const options = await getAdminSessionCreateOptionsData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Yoklama Oturumu Oluştur"
        description="Kurum kapsamındaki ders, şube, oda ve öğretmen bilgileriyle yeni yoklama oturumu hazırlayın."
      >
        <ButtonLink
          href={routes.admin.sessions}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="Sunucu işlemi" tone="info" />
      </PageHeader>

      <AdminCreateSessionForm options={options} />
    </>
  );
}
