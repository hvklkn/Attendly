import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { AdminCreateRoomForm } from "@/app/(admin)/admin/rooms/new/AdminCreateRoomForm";

export default async function AdminCreateRoomPage() {
  const authContext = await requireAdminAuthContext();

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Oda Oluştur"
        description="Yoklama oturumlarında kullanılacak oda ve konum bilgisini tanımlayın."
      >
        <ButtonLink
          href={routes.admin.rooms}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="Kurum kapsamlı" tone="info" />
      </PageHeader>

      <AdminCreateRoomForm />
    </>
  );
}
