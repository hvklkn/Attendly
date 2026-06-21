import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
import { getAdminSectionCreateOptionsData } from "@/lib/admin/queries";
import {
  assignAdminSectionInstructorAction,
  unassignAdminSectionInstructorAction,
  updateAdminSectionAction,
} from "@/lib/admin/section-actions";
import { db } from "@/lib/db";
import { getRoleLabel } from "@/lib/localization";
import { AdminCreateSectionForm } from "../../new/AdminCreateSectionForm";

type AdminSectionEditPageProps = {
  params: Promise<{
    sectionId: string;
  }>;
};

export default async function AdminSectionEditPage({
  params,
}: AdminSectionEditPageProps) {
  const [{ sectionId }, authContext] = await Promise.all([
    params,
    requireAdminAuthContext(),
  ]);
  const [section, options] = await Promise.all([
    db.section.findFirst({
      where: {
        id: sectionId,
        organizationId: getAdminOrganizationId(authContext),
      },
      select: {
        id: true,
        courseId: true,
        instructorMembershipId: true,
        name: true,
        code: true,
        isActive: true,
        instructorAssignments: {
          where: {
            isActive: true,
          },
          orderBy: {
            assignedAt: "asc",
          },
          select: {
            instructorMembershipId: true,
            instructorMembership: {
              select: {
                role: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    getAdminSectionCreateOptionsData(authContext),
  ]);

  if (!section) {
    notFound();
  }

  const optionsWithCurrentCourse = options.courses.some(
    (course) => course.id === section.courseId,
  )
    ? options
    : {
        ...options,
        courses: [
          ...options.courses,
          ...(await db.course.findMany({
            where: {
              id: section.courseId,
              organizationId: getAdminOrganizationId(authContext),
            },
            select: {
              id: true,
              code: true,
              title: true,
            },
          })),
        ],
      };

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Ders Grubu Düzenle"
        description="Ders grubu bilgilerini, atanmış öğretmeni ve aktiflik durumunu güncelleyin."
      >
        <ButtonLink
          href={routes.admin.sections}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Ders Gruplarına Dön
        </ButtonLink>
        <StatusBadge
          label={section.isActive ? "Aktif" : "Pasif"}
          tone={section.isActive ? "success" : "neutral"}
        />
      </PageHeader>

      {!section.isActive ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Bu kayıt pasif olduğu için yeni işlemlerde kullanılamaz.
        </div>
      ) : null}

      <AdminCreateSectionForm
        options={optionsWithCurrentCourse}
        action={updateAdminSectionAction}
        sectionId={section.id}
        submitLabel="Ders Grubunu Güncelle"
        initialValues={{
          courseId: section.courseId,
          name: section.name,
          code: section.code ?? "",
          instructorMembershipId: section.instructorMembershipId ?? "",
          isActive: section.isActive ? "on" : "",
        }}
      />

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-950">
            Atanmış Öğretmenler
          </h2>
          <p className="text-sm leading-6 text-neutral-600">
            Öğretmenler yalnızca kendilerine atanmış şubeler için yoklama
            oluşturabilir.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {section.instructorAssignments.length > 0 ? (
            section.instructorAssignments.map((assignment) => (
              <div
                key={assignment.instructorMembershipId}
                className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-950">
                    {assignment.instructorMembership.user.name
                      ? `${assignment.instructorMembership.user.name} · ${assignment.instructorMembership.user.email}`
                      : assignment.instructorMembership.user.email}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {getRoleLabel(assignment.instructorMembership.role)}
                  </p>
                </div>
                <form action={unassignAdminSectionInstructorAction}>
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input
                    type="hidden"
                    name="instructorMembershipId"
                    value={assignment.instructorMembershipId}
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
                  >
                    Şubeden Kaldır
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Bu şubeye atanmış öğretmen yok.
            </p>
          )}
        </div>

        <form
          action={assignAdminSectionInstructorAction}
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_160px]"
        >
          <input type="hidden" name="sectionId" value={section.id} />
          <label>
            <span className="sr-only">Öğretmen Ata</span>
            <select
              name="instructorMembershipId"
              required
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Öğretmen seçin</option>
              {options.responsibleCandidates.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {membership.user.name
                    ? `${membership.user.name} · ${membership.user.email}`
                    : membership.user.email}
                  {" · "}
                  {getRoleLabel(membership.role)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Öğretmen Ata
          </button>
        </form>
      </section>
    </>
  );
}
