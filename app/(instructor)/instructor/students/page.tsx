import { FileUp, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorStudentsData } from "@/lib/instructor/queries";
import {
  formatDateTr,
  getEnrollmentStatusLabel,
  getUserStatusLabel,
} from "@/lib/localization";

type InstructorStudentsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    created?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;

  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getEnrollmentTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "neutral" as const;
}

function getUserStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "INVITED") return "warning" as const;
  if (status === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

function formatSection(section: {
  name: string;
  code: string | null;
  course: {
    code: string;
    title: string;
  };
}) {
  const sectionName = section.code
    ? `${section.code} · ${section.name}`
    : section.name;

  return `${section.course.code} · ${sectionName}`;
}

export default async function InstructorStudentsPage({
  searchParams,
}: InstructorStudentsPageProps) {
  const authContext = await requireInstructorAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const created = getSearchValue(resolvedSearchParams?.created) === "1";
  const enrollments = await getInstructorStudentsData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğrenciler"
        description="Kendi ders gruplarınıza kayıtlı öğrencileri görüntüleyin ve yeni öğrenci ekleyin."
      >
        <ButtonLink
          href={routes.instructor.studentCreate}
          variant="primary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrenci Ekle
        </ButtonLink>
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrenci bu ders grubuna eklendi.
        </div>
      ) : null}

      <SectionCard
        title="CSV Aktarımı"
        description="Öğrenci listesini CSV dosyasıyla toplu olarak aktarma özelliği sonraki adımda eklenecek."
        actions={
          <button
            type="button"
            disabled
            className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-400"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            CSV ile Öğrenci Yükle
          </button>
        }
      >
        <p className="text-sm leading-6 text-neutral-600">
          Toplu aktarım açıldığında öğrenciler yine yalnızca sizin ders
          gruplarınıza kayıt edilecek.
        </p>
      </SectionCard>

      <SectionCard
        title="Kayıtlı Öğrenciler"
        description="Liste yalnızca öğretmeni olduğunuz ders gruplarındaki öğrenci kayıtlarını gösterir."
      >
        <form
          action={routes.instructor.students}
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_120px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Öğrenci ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Ad, e-posta veya ders grubu ara"
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

        {enrollments.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Ad Soyad</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Ders Grubu</th>
                    <th className="px-4 py-3">Kayıt Durumu</th>
                    <th className="px-4 py-3">Hesap Durumu</th>
                    <th className="px-4 py-3">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {getInitials(
                              enrollment.studentMembership.user.name,
                              enrollment.studentMembership.user.email,
                            )}
                          </div>
                          <span className="font-medium text-neutral-950">
                            {enrollment.studentMembership.user.name ??
                              "İsimsiz öğrenci"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {enrollment.studentMembership.user.email}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatSection(enrollment.section)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={getEnrollmentStatusLabel(enrollment.status)}
                          tone={getEnrollmentTone(enrollment.status)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={getUserStatusLabel(
                            enrollment.studentMembership.user.status,
                          )}
                          tone={getUserStatusTone(
                            enrollment.studentMembership.user.status,
                          )}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTr(enrollment.enrolledAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {enrollments.map((enrollment) => (
                <article
                  key={enrollment.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                      {getInitials(
                        enrollment.studentMembership.user.name,
                        enrollment.studentMembership.user.email,
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950">
                        {enrollment.studentMembership.user.name ??
                          "İsimsiz öğrenci"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {enrollment.studentMembership.user.email}
                      </p>
                      <p className="mt-3 text-sm text-neutral-600">
                        {formatSection(enrollment.section)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          label={getEnrollmentStatusLabel(enrollment.status)}
                          tone={getEnrollmentTone(enrollment.status)}
                        />
                        <StatusBadge
                          label={getUserStatusLabel(
                            enrollment.studentMembership.user.status,
                          )}
                          tone={getUserStatusTone(
                            enrollment.studentMembership.user.status,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={
              query
                ? "Aramanızla eşleşen öğrenci yok"
                : "Bu derse kayıtlı öğrenci yok"
            }
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Öğrenciler ders gruplarınıza eklendiğinde burada listelenecek."
            }
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.instructor.studentCreate}
            actionLabel="Öğrenci Ekle"
          />
        )}
      </SectionCard>
    </>
  );
}
