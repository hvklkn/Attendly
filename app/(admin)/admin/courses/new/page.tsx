import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { AdminCreateCourseForm } from "@/app/(admin)/admin/courses/new/AdminCreateCourseForm";

export default async function AdminCreateCoursePage() {
  const authContext = await requireAdminAuthContext();

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Ders / Kurs Oluştur"
        description="Kurumunuz için ders veya kurs kaydı oluşturun."
      >
        <ButtonLink
          href={routes.admin.courses}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Geri
        </ButtonLink>
        <StatusBadge label="Kurum kapsamlı" tone="info" />
      </PageHeader>

      <AdminCreateCourseForm />
    </>
  );
}
