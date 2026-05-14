import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminUserCreateOptionsData } from "@/lib/admin/queries";
import type { AdminCreatableUserRole } from "@/lib/admin/user-create";
import { AdminCreateUserForm } from "@/app/(admin)/admin/users/new/AdminCreateUserForm";

type AdminCreateUserPageProps = {
  searchParams?: Promise<{
    role?: string | string[];
  }>;
};

function getInitialRole(value: string | string[] | undefined): AdminCreatableUserRole {
  const role = Array.isArray(value) ? value[0] : value;

  if (role === "ORG_ADMIN") {
    return "ORG_ADMIN";
  }

  if (role === "STUDENT") {
    return "STUDENT";
  }

  return "INSTRUCTOR";
}

export default async function AdminCreateUserPage({
  searchParams,
}: AdminCreateUserPageProps) {
  const authContext = await requireAdminAuthContext();
  const [resolvedSearchParams, options] = await Promise.all([
    searchParams,
    getAdminUserCreateOptionsData(authContext),
  ]);
  const initialRole = getInitialRole(resolvedSearchParams?.role);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Kullanıcı Ekle"
        description="Kurumunuza öğretmen veya öğrenci hesabı oluşturun. Rol ve üyelik bilgileri yalnızca mevcut kurum kapsamında kaydedilir."
      >
        <ButtonLink
          href={routes.admin.users}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge
          label="Kurum kapsamlı"
          tone="info"
        />
      </PageHeader>

      <AdminCreateUserForm initialRole={initialRole} options={options} />
    </>
  );
}
