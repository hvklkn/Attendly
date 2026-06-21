import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminPasswordSupportPanel } from "@/components/password/AdminPasswordSupportPanel";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { getRoleLabel, getUserStatusLabel } from "@/lib/localization";
import { AdminEditUserForm } from "./AdminEditUserForm";

type AdminUserEditPageProps = {
  params: Promise<{
    membershipId: string;
  }>;
};

export default async function AdminUserEditPage({
  params,
}: AdminUserEditPageProps) {
  const [{ membershipId }, authContext] = await Promise.all([
    params,
    requireAdminAuthContext(),
  ]);
  const membership = await db.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: getAdminOrganizationId(authContext),
    },
    select: {
      id: true,
      role: true,
      studentNo: true,
      user: {
        select: {
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Kullanıcı Düzenle"
        description="Kullanıcı hesabını pasifleştirin veya temel bilgilerini güncelleyin."
      >
        <ButtonLink
          href={routes.admin.users}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Kullanıcılara Dön
        </ButtonLink>
        <StatusBadge label={getRoleLabel(membership.role)} tone="info" />
        <StatusBadge
          label={getUserStatusLabel(membership.user.status)}
          tone={membership.user.status === "ACTIVE" ? "success" : "neutral"}
        />
      </PageHeader>

      {membership.user.status !== "ACTIVE" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Bu kayıt pasif olduğu için yeni işlemlerde kullanılamaz.
        </div>
      ) : null}

      <AdminEditUserForm
        membershipId={membership.id}
        role={membership.role}
        initialValues={{
          name: membership.user.name ?? "",
          email: membership.user.email,
          studentNo: membership.studentNo ?? "",
          isActive: membership.user.status === "ACTIVE" ? "on" : "",
        }}
      />

      <AdminPasswordSupportPanel membershipId={membership.id} />
    </>
  );
}
