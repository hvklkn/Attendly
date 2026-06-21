import { FileUp, Pencil, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  assignInstructorStudentToSectionAction,
  deactivateInstructorEnrollmentAction,
  reactivateInstructorEnrollmentAction,
} from "@/lib/instructor/student-actions";
import { getInstructorStudentsData } from "@/lib/instructor/queries";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import {
  formatDateTr,
  getEnrollmentStatusLabel,
  getUserStatusLabel,
} from "@/lib/localization";

type InstructorStudentsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    sectionId?: string | string[];
    enrollmentStatus?: string | string[];
    created?: string | string[];
    updated?: string | string[];
    assigned?: string | string[];
    deactivated?: string | string[];
    reactivated?: string | string[];
    assignError?: string | string[];
    deactivateError?: string | string[];
    reactivateError?: string | string[];
  }>;
};

type SectionSummary = {
  id: string;
  name: string;
  code: string | null;
  course: {
    code: string;
    title: string;
  };
  _count: {
    enrollments: number;
  };
};

type EnrollmentSummary = {
  id: string;
  status: string;
  enrolledAt: Date;
  endedAt: Date | null;
  section: {
    id: string;
    name: string;
    code: string | null;
    course: {
      code: string;
      title: string;
    };
  };
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getEnrollmentStatusFilter(value: string | string[] | undefined) {
  const status = getSearchValue(value);

  if (
    status === EnrollmentStatus.ACTIVE ||
    status === EnrollmentStatus.INACTIVE ||
    status === EnrollmentStatus.COMPLETED ||
    status === EnrollmentStatus.WITHDRAWN ||
    status === EnrollmentStatus.SUSPENDED
  ) {
    return status;
  }

  return undefined;
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
  if (status === "INACTIVE" || status === "WITHDRAWN") return "neutral" as const;
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

function formatSectionOption(section: SectionSummary) {
  const sectionName = section.code ?? `${section.course.code}-${section.name}`;

  return `${sectionName} (${section._count.enrollments} öğrenci)`;
}

function EnrollmentList({ enrollments }: { enrollments: EnrollmentSummary[] }) {
  if (enrollments.length === 0) {
    return <p className="text-sm text-neutral-500">Henüz şube kaydı yok.</p>;
  }

  return (
    <div className="grid gap-2">
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-950">
              {formatSection(enrollment.section)}
            </span>
            <StatusBadge
              label={getEnrollmentStatusLabel(enrollment.status)}
              tone={getEnrollmentTone(enrollment.status)}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span>Kayıt: {formatDateTr(enrollment.enrolledAt)}</span>
            {enrollment.endedAt ? (
              <span>Çıkış: {formatDateTr(enrollment.endedAt)}</span>
            ) : null}
          </div>
          {enrollment.status === "ACTIVE" ? (
            <form action={deactivateInstructorEnrollmentAction} className="mt-3">
              <input type="hidden" name="enrollmentId" value={enrollment.id} />
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                Şubeden Çıkar
              </button>
            </form>
          ) : enrollment.status === "INACTIVE" ? (
            <form action={reactivateInstructorEnrollmentAction} className="mt-3">
              <input type="hidden" name="enrollmentId" value={enrollment.id} />
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                Tekrar Aktif Yap
              </button>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AssignSectionForm({
  studentMembershipId,
  sections,
}: {
  studentMembershipId: string;
  sections: SectionSummary[];
}) {
  return (
    <form action={assignInstructorStudentToSectionAction} className="grid gap-2">
      <input
        type="hidden"
        name="studentMembershipId"
        value={studentMembershipId}
      />
      <label className="sr-only" htmlFor={`section-${studentMembershipId}`}>
        Şube seç
      </label>
      <select
        id={`section-${studentMembershipId}`}
        name="sectionId"
        required
        className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500"
      >
        <option value="">Şube seç</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {formatSectionOption(section)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-3 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Şubeye Ata
      </button>
    </form>
  );
}

export default async function InstructorStudentsPage({
  searchParams,
}: InstructorStudentsPageProps) {
  const authContext = await requireInstructorAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const sectionId = getSearchValue(resolvedSearchParams?.sectionId).trim();
  const enrollmentStatus = getEnrollmentStatusFilter(
    resolvedSearchParams?.enrollmentStatus,
  );
  const created = getSearchValue(resolvedSearchParams?.created) === "1";
  const updated = getSearchValue(resolvedSearchParams?.updated) === "1";
  const assigned = getSearchValue(resolvedSearchParams?.assigned) === "1";
  const deactivated =
    getSearchValue(resolvedSearchParams?.deactivated) === "1";
  const reactivated =
    getSearchValue(resolvedSearchParams?.reactivated) === "1";
  const assignError =
    getSearchValue(resolvedSearchParams?.assignError) === "1";
  const deactivateError =
    getSearchValue(resolvedSearchParams?.deactivateError) === "1";
  const reactivateError =
    getSearchValue(resolvedSearchParams?.reactivateError) === "1";
  const { students, sections } = await getInstructorStudentsData(authContext, {
    query,
    sectionId,
    enrollmentStatus,
  });
  const hasFilters = Boolean(query || sectionId || enrollmentStatus);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğrenciler"
        description="Kurum öğrencilerini görüntüleyin, şubelere atayın ve kayıt durumlarını yönetin."
      >
        <ButtonLink
          href={routes.instructor.studentCreate}
          variant="secondary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrenci Ekle
        </ButtonLink>
        <ButtonLink
          href={routes.instructor.studentImport}
          variant="primary"
          icon={<FileUp className="h-4 w-4" aria-hidden="true" />}
        >
          CSV ile Yükle
        </ButtonLink>
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrenci bu ders grubuna eklendi.
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrenci bilgileri güncellendi.
        </div>
      ) : null}
      {assigned ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrenci seçilen şubeye atandı.
        </div>
      ) : null}
      {deactivated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrencinin şube kaydı pasifleştirildi.
        </div>
      ) : null}
      {reactivated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrencinin şube kaydı tekrar aktif yapıldı.
        </div>
      ) : null}
      {assignError || deactivateError || reactivateError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          İşlem tamamlanamadı. Lütfen öğrenci ve şube seçimini kontrol edin.
        </div>
      ) : null}

      <SectionCard
        title="CSV Aktarımı"
        description="Ad ve e-posta kolonlarını içeren CSV dosyasıyla öğrencileri toplu ekleyin; şube koduyla şubeye atayın."
        actions={
          <ButtonLink
            href={routes.instructor.studentImport}
            variant="primary"
            icon={<FileUp className="h-4 w-4" aria-hidden="true" />}
          >
            CSV ile Öğrenci Yükle
          </ButtonLink>
        }
      >
        <p className="text-sm leading-6 text-neutral-600">
          Önizlemede hatalı satırlar, tekrarlanan e-posta ve bulunamayan şube
          kodu değerleri gösterilir; onay vermeden kayıt oluşturulmaz.
        </p>
      </SectionCard>

      <SectionCard
        title="Öğrenciler ve Şubeler"
        description="Her öğrencinin kayıtlı olduğu şubeler ve kayıt durumları burada görünür."
      >
        <form
          action={routes.instructor.students}
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_180px_120px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Öğrenci ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Ad, e-posta veya şube ara"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <label>
            <span className="sr-only">Şube</span>
            <select
              name="sectionId"
              defaultValue={sectionId}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Tüm şubeler</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {formatSectionOption(section)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Kayıt durumu</span>
            <select
              name="enrollmentStatus"
              defaultValue={enrollmentStatus ?? ""}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Tüm durumlar</option>
              <option value={EnrollmentStatus.ACTIVE}>Aktif kayıt</option>
              <option value={EnrollmentStatus.INACTIVE}>Pasif kayıt</option>
              <option value={EnrollmentStatus.COMPLETED}>Tamamlandı</option>
              <option value={EnrollmentStatus.WITHDRAWN}>Çekildi</option>
              <option value={EnrollmentStatus.SUSPENDED}>Askıya alındı</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Ara
          </button>
        </form>

        {students.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Öğrenci</th>
                    <th className="px-4 py-3">Kayıtlı Şubeler</th>
                    <th className="px-4 py-3">Hesap Durumu</th>
                    <th className="px-4 py-3">Şubeye Ata</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {getInitials(student.user.name, student.user.email)}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-950">
                              {student.user.name ?? "İsimsiz öğrenci"}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {student.user.email}
                            </p>
                            {student.studentNo ? (
                              <p className="mt-1 text-xs text-neutral-500">
                                Öğrenci No: {student.studentNo}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <EnrollmentList enrollments={student.enrollments} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={getUserStatusLabel(student.user.status)}
                          tone={getUserStatusTone(student.user.status)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <AssignSectionForm
                          studentMembershipId={student.id}
                          sections={sections}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <ButtonLink
                          href={`/instructor/students/${student.id}/edit`}
                          icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                        >
                          Düzenle
                        </ButtonLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {students.map((student) => (
                <article
                  key={student.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                      {getInitials(student.user.name, student.user.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950">
                        {student.user.name ?? "İsimsiz öğrenci"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {student.user.email}
                      </p>
                      {student.studentNo ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          Öğrenci No: {student.studentNo}
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <StatusBadge
                          label={getUserStatusLabel(student.user.status)}
                          tone={getUserStatusTone(student.user.status)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-neutral-700">
                      Kayıtlı Şubeler
                    </p>
                    <EnrollmentList enrollments={student.enrollments} />
                  </div>
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <AssignSectionForm
                      studentMembershipId={student.id}
                      sections={sections}
                    />
                  </div>
                  <div className="mt-4">
                    <ButtonLink
                      href={`/instructor/students/${student.id}/edit`}
                      icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                    >
                      Düzenle
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={
              hasFilters
                ? "Aramanızla eşleşen öğrenci yok"
                : "Kurumda öğrenci yok"
            }
            description={
              hasFilters
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Öğrenciler eklendiğinde burada listelenecek."
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
