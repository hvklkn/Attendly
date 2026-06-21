import { BookOpen, Pencil, Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import {
  deactivateAdminCourseAction,
  reactivateAdminCourseAction,
} from "@/lib/admin/course-actions";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminCoursesData } from "@/lib/admin/queries";

type AdminCoursesPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    created?: string | string[];
    updated?: string | string[];
    deactivated?: string | string[];
    reactivated?: string | string[];
    error?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function AdminCoursesPage({
  searchParams,
}: AdminCoursesPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const created = getSearchValue(resolvedSearchParams?.created) === "1";
  const updated = getSearchValue(resolvedSearchParams?.updated) === "1";
  const deactivated =
    getSearchValue(resolvedSearchParams?.deactivated) === "1";
  const reactivated =
    getSearchValue(resolvedSearchParams?.reactivated) === "1";
  const errorMessage = getSearchValue(resolvedSearchParams?.error);
  const courses = await getAdminCoursesData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Dersler / Kurslar"
        description="Kurumunuzdaki ders ve kurs kayıtlarını yönetin."
      >
        <ButtonLink
          href={routes.admin.courseCreate}
          variant="primary"
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Ders / Kurs Oluştur
        </ButtonLink>
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Ders / kurs oluşturuldu.
        </div>
      ) : null}
      {updated || deactivated || reactivated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Ders / kurs güncellendi.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <SectionCard
        title="Ders / Kurs Listesi"
        description="Kodlar kurum içinde benzersizdir; ders grupları bu kayıtların altında oluşturulur."
      >
        <form
          action={routes.admin.courses}
          className="mb-5 grid gap-3 sm:grid-cols-[1fr_140px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Ders / kurs ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Ders / kurs ara"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Ara
          </button>
        </form>

        {courses.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Kod</th>
                    <th className="px-4 py-3">Ders / Kurs Adı</th>
                    <th className="px-4 py-3">Açıklama</th>
                    <th className="px-4 py-3">Ders Grubu</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-4 py-4 font-medium text-neutral-950">
                        {course.code}
                      </td>
                      <td className="px-4 py-4 text-neutral-700">
                        {course.title}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {course.description ?? "Açıklama yok"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {course._count.sections}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={course.isActive ? "Aktif" : "Pasif"}
                          tone={course.isActive ? "success" : "neutral"}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink
                            href={`/admin/courses/${course.id}/edit`}
                            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                          >
                            Düzenle
                          </ButtonLink>
                          <form
                            action={
                              course.isActive
                                ? deactivateAdminCourseAction
                                : reactivateAdminCourseAction
                            }
                          >
                            <input type="hidden" name="courseId" value={course.id} />
                            <button
                              type="submit"
                              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
                            >
                              {course.isActive ? "Pasifleştir" : "Tekrar Aktifleştir"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-950">
                        {course.code} · {course.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {course.description ?? "Açıklama yok"}
                      </p>
                    </div>
                    <StatusBadge
                      label={course.isActive ? "Aktif" : "Pasif"}
                      tone={course.isActive ? "success" : "neutral"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-neutral-500">
                    {course._count.sections} ders grubu
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink
                      href={`/admin/courses/${course.id}/edit`}
                      icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                    >
                      Düzenle
                    </ButtonLink>
                    <form
                      action={
                        course.isActive
                          ? deactivateAdminCourseAction
                          : reactivateAdminCourseAction
                      }
                    >
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
                      >
                        {course.isActive ? "Pasifleştir" : "Tekrar Aktifleştir"}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? "Aramanızla eşleşen ders / kurs yok" : "Ders / kurs bulunmuyor"}
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Ders grubu oluşturmadan önce kurumunuz için bir ders / kurs oluşturun."
            }
            icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.courseCreate}
            actionLabel="Yeni Ders Oluştur"
          />
        )}
      </SectionCard>
    </>
  );
}
