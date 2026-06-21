import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { updateAdminCourseAction } from "@/lib/admin/course-actions";
import { getAdminOrganizationId } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { AdminCreateCourseForm } from "../../new/AdminCreateCourseForm";

type AdminCourseEditPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function AdminCourseEditPage({
  params,
}: AdminCourseEditPageProps) {
  const [{ courseId }, authContext] = await Promise.all([
    params,
    requireAdminAuthContext(),
  ]);
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      organizationId: getAdminOrganizationId(authContext),
    },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      isActive: true,
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Ders / Kurs Düzenle"
        description="Ders bilgilerini güncelleyin veya yeni işlemlerden pasifleştirin."
      >
        <ButtonLink
          href={routes.admin.courses}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Derslere Dön
        </ButtonLink>
        <StatusBadge
          label={course.isActive ? "Aktif" : "Pasif"}
          tone={course.isActive ? "success" : "neutral"}
        />
      </PageHeader>

      {!course.isActive ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Bu kayıt pasif olduğu için yeni işlemlerde kullanılamaz.
        </div>
      ) : null}

      <AdminCreateCourseForm
        action={updateAdminCourseAction}
        courseId={course.id}
        submitLabel="Ders / Kurs Güncelle"
        initialValues={{
          title: course.title,
          code: course.code,
          description: course.description ?? "",
          isActive: course.isActive ? "on" : "",
        }}
      />
    </>
  );
}
