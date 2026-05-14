import { BookOpen, CalendarDays, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { assignAdminSectionInstructorAction } from "@/lib/admin/section-actions";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminSectionCreateOptionsData,
  getAdminSectionsData,
} from "@/lib/admin/queries";

type AdminSectionsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    created?: string | string[];
    assigned?: string | string[];
    error?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatPerson(user: { name: string | null; email: string } | null) {
  if (!user) {
    return "Öğretmen henüz atanmadı";
  }

  return user.name ? `${user.name} · ${user.email}` : user.email;
}

function formatSectionName(section: { name: string; code: string | null }) {
  return section.code ? `${section.code} · ${section.name}` : section.name;
}

function AssignInstructorForm({
  sectionId,
  instructors,
}: {
  sectionId: string;
  instructors: Array<{
    id: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}) {
  if (instructors.length === 0) {
    return <span>Öğretmen henüz atanmadı</span>;
  }

  return (
    <form action={assignAdminSectionInstructorAction} className="grid gap-2">
      <input type="hidden" name="sectionId" value={sectionId} />
      <label>
        <span className="sr-only">Öğretmen Ata</span>
        <select
          name="instructorMembershipId"
          required
          className="h-9 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
        >
          <option value="">Öğretmen Ata</option>
          {instructors.map((membership) => (
            <option key={membership.id} value={membership.id}>
              {formatPerson(membership.user)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex h-8 items-center justify-center rounded-md bg-neutral-950 px-3 text-xs font-medium text-white transition hover:bg-neutral-800"
      >
        Öğretmen Ata
      </button>
    </form>
  );
}

export default async function AdminSectionsPage({
  searchParams,
}: AdminSectionsPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const created = getSearchValue(resolvedSearchParams?.created) === "1";
  const assigned = getSearchValue(resolvedSearchParams?.assigned) === "1";
  const errorMessage = getSearchValue(resolvedSearchParams?.error);
  const [sections, options] = await Promise.all([
    getAdminSectionsData(authContext, { query }),
    getAdminSectionCreateOptionsData(authContext),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Ders Grupları"
        description="Ders, öğretmen ve öğrenci kayıtlarını aynı kurum kapsamında yönetin."
      >
        <ButtonLink
          href={routes.admin.sectionCreate}
          variant="primary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Ders Grubu Oluştur
        </ButtonLink>
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Ders grubu oluşturuldu.
        </div>
      ) : null}
      {assigned ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Ders grubu güncellendi. Öğretmen başarıyla atandı.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <SectionCard
        title="Ders Grubu Listesi"
        description="Oturumlar, atanmış öğretmen üzerinden öğretmen panelinde görünür."
      >
        <form
          action={routes.admin.sections}
          className="mb-5 grid gap-3 sm:grid-cols-[1fr_140px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Ders grubu ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Ders, öğretmen veya grup ara"
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

        {sections.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Ders Grubu</th>
                    <th className="px-4 py-3">Ders / Kurs</th>
                    <th className="px-4 py-3">Atanmış Öğretmen</th>
                    <th className="px-4 py-3">Kayıtlı Öğrenciler</th>
                    <th className="px-4 py-3">Yoklama Oturumları</th>
                    <th className="px-4 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {sections.map((section) => (
                    <tr key={section.id}>
                      <td className="px-4 py-4 font-medium text-neutral-950">
                        {formatSectionName(section)}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {section.course.code} · {section.course.title}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {section.instructorMembership ? (
                          formatPerson(section.instructorMembership.user)
                        ) : (
                          <AssignInstructorForm
                            sectionId={section.id}
                            instructors={options.instructors}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {section._count.enrollments}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {section._count.attendanceSessions}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={section.isActive ? "Aktif" : "Pasif"}
                          tone={section.isActive ? "success" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {sections.map((section) => (
                <article
                  key={section.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-950">
                        {formatSectionName(section)}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {section.course.code} · {section.course.title}
                      </p>
                    </div>
                    <StatusBadge
                      label={section.isActive ? "Aktif" : "Pasif"}
                      tone={section.isActive ? "success" : "neutral"}
                    />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="text-neutral-500">Atanmış Öğretmen</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatPerson(section.instructorMembership?.user ?? null)}
                        {!section.instructorMembership ? (
                          <div className="mt-3">
                            <AssignInstructorForm
                              sectionId={section.id}
                              instructors={options.instructors}
                            />
                          </div>
                        ) : null}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-neutral-500">
                          Kayıtlı Öğrenciler
                        </dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {section._count.enrollments}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">
                          Yoklama Oturumları
                        </dt>
                        <dd className="mt-1 font-medium text-neutral-900">
                          {section._count.attendanceSessions}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={
              query
                ? "Aramanızla eşleşen ders grubu yok"
                : "Ders grubu bulunmuyor"
            }
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Yoklama oturumu oluşturmadan önce ders grubunu ve atanmış öğretmeni tanımlayın."
            }
            icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.sectionCreate}
            actionLabel="Ders Grubu Oluştur"
          />
        )}
      </SectionCard>

      <SectionCard
        title="İlişki Modeli"
        description="Öğrenciler öğretmene doğrudan değil, ders grubu kayıtları üzerinden bağlanır."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <BookOpen className="h-5 w-5 text-neutral-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-neutral-950">
              Öğretmen Ata
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Her ders grubunun bir atanmış öğretmeni vardır.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <Users className="h-5 w-5 text-neutral-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-neutral-950">
              Öğrenci Ata
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Bir öğrenci birden fazla ders grubuna kayıt olabilir.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <CalendarDays
              className="h-5 w-5 text-neutral-500"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-neutral-950">
              Oturum Görünürlüğü
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Yoklama oturumu atanmış öğretmenin panelinde görünecek.
            </p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
