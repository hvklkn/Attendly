import { FileUp, Pencil, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import {
  getAdminUserCreateOptionsData,
  getAdminUsersData,
} from "@/lib/admin/queries";
import {
  deactivateAdminEnrollmentAction,
  reactivateAdminEnrollmentAction,
} from "@/lib/admin/user-actions";
import { EnrollmentStatus, MembershipRole } from "@/lib/generated/prisma/enums";
import {
  formatDateTr,
  getEnrollmentStatusLabel,
  getRoleLabel,
  getUserStatusLabel,
} from "@/lib/localization";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    role?: string | string[];
    sectionId?: string | string[];
    enrollmentStatus?: string | string[];
    deactivated?: string | string[];
    reactivated?: string | string[];
    updated?: string | string[];
    enrollmentError?: string | string[];
  }>;
};

const ROLE_FILTER_OPTIONS = [
  MembershipRole.ORG_ADMIN,
  MembershipRole.INSTRUCTOR,
  MembershipRole.STUDENT,
] as const;

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

function getRoleFilterValue(value: string | string[] | undefined) {
  const role = getSearchValue(value);

  if (
    role === MembershipRole.ORG_ADMIN ||
    role === MembershipRole.INSTRUCTOR ||
    role === MembershipRole.STUDENT
  ) {
    return role;
  }

  return undefined;
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

function formatEnum(value: string) {
  if (
    value === "SUPER_ADMIN" ||
    value === "ORG_ADMIN" ||
    value === "INSTRUCTOR" ||
    value === "STUDENT"
  ) {
    return getRoleLabel(value);
  }

  return getUserStatusLabel(value);
}

function getRoleTone(role: string) {
  if (role === "ORG_ADMIN" || role === "SUPER_ADMIN") return "info" as const;
  if (role === "INSTRUCTOR") return "success" as const;
  return "neutral" as const;
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "INVITED") return "warning" as const;
  if (status === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

function getEnrollmentTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  if (status === "INACTIVE" || status === "WITHDRAWN") return "neutral" as const;
  return "neutral" as const;
}

function formatSection(section: {
  name: string;
  code: string | null;
  course: {
    code: string;
  };
}) {
  const sectionName = section.code
    ? `${section.code} · ${section.name}`
    : section.name;

  return `${section.course.code} · ${sectionName}`;
}

function formatSectionOption(section: {
  name: string;
  code: string | null;
  course: {
    code: string;
    title: string;
  };
  _count: {
    enrollments: number;
  };
}) {
  const sectionName = section.code ?? `${section.course.code}-${section.name}`;

  return `${sectionName} (${section._count.enrollments} öğrenci)`;
}

function EnrollmentList({
  enrollments,
}: {
  enrollments: Array<{
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
  }>;
}) {
  if (enrollments.length === 0) {
    return <span className="text-sm text-neutral-500">Ders grubu yok</span>;
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
            <form action={deactivateAdminEnrollmentAction} className="mt-3">
              <input type="hidden" name="enrollmentId" value={enrollment.id} />
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                Pasifleştir
              </button>
            </form>
          ) : enrollment.status === "INACTIVE" ? (
            <form action={reactivateAdminEnrollmentAction} className="mt-3">
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

function formatMembershipScope(membership: {
  role: string;
  _count: {
    instructedSections: number;
  };
}) {
  if (membership.role === MembershipRole.INSTRUCTOR) {
    return `${membership._count.instructedSections} ders grubu`;
  }

  if (membership.role !== MembershipRole.STUDENT) {
    return "Kurum kapsamı";
  }

  return "Ders grubu yok";
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const role = getRoleFilterValue(resolvedSearchParams?.role);
  const sectionId = getSearchValue(resolvedSearchParams?.sectionId).trim();
  const enrollmentStatus = getEnrollmentStatusFilter(
    resolvedSearchParams?.enrollmentStatus,
  );
  const deactivated =
    getSearchValue(resolvedSearchParams?.deactivated) === "1";
  const reactivated =
    getSearchValue(resolvedSearchParams?.reactivated) === "1";
  const updated = getSearchValue(resolvedSearchParams?.updated) === "1";
  const enrollmentError =
    getSearchValue(resolvedSearchParams?.enrollmentError) === "1";
  const [memberships, options] = await Promise.all([
    getAdminUsersData(authContext, {
      query,
      role,
      sectionId,
      enrollmentStatus,
    }),
    getAdminUserCreateOptionsData(authContext),
  ]);
  const hasFilters = Boolean(query || role || sectionId || enrollmentStatus);

  return (
    <>
      <PageHeader
        eyebrow="Erişim yönetimi"
        title="Kullanıcılar"
        description="Kurum üyelerini görüntüleyin; yönetici, öğretmen ve öğrenci hesaplarını güvenli şekilde oluşturun."
      >
        <ButtonLink
          href={`${routes.admin.usersNew}?role=ORG_ADMIN`}
          variant="secondary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Yönetici Ekle
        </ButtonLink>
        <ButtonLink
          href={`${routes.admin.usersNew}?role=INSTRUCTOR`}
          variant="secondary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Öğretmen Ekle
        </ButtonLink>
        <ButtonLink
          href={`${routes.admin.usersNew}?role=STUDENT`}
          variant="secondary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrenci Ekle
        </ButtonLink>
        <ButtonLink
          href={routes.admin.studentImport}
          variant="primary"
          icon={<FileUp className="h-4 w-4" aria-hidden="true" />}
        >
          CSV ile Yükle
        </ButtonLink>
      </PageHeader>

      {deactivated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrencinin şube kaydı pasifleştirildi.
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Kullanıcı bilgileri güncellendi.
        </div>
      ) : null}
      {reactivated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Öğrencinin şube kaydı tekrar aktif yapıldı.
        </div>
      ) : null}
      {enrollmentError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Kayıt durumu güncellenemedi. Lütfen seçimi kontrol edin.
        </div>
      ) : null}

      <SectionCard
        title="Toplu Aktarım"
        description="CSV dosyasıyla çok sayıda öğrenciyi oluşturun ve şube koduyla şubelere atayın."
        actions={
          <ButtonLink
            href={routes.admin.studentImport}
            variant="primary"
            icon={<FileUp className="h-4 w-4" aria-hidden="true" />}
          >
            CSV ile Öğrenci Yükle
          </ButtonLink>
        }
      >
        <p className="text-sm leading-6 text-neutral-600">
          Önizlemede geçerli satır, hatalı satır, tekrarlanan e-posta ve
          bulunamayan şube kodu değerleri gösterilir; onay vermeden veri yazılmaz.
        </p>
      </SectionCard>

      <SectionCard
        title="Kullanıcı Listesi"
        description="Üyelik kayıtları kullanıcı detayları seçilmeden önce geçerli kurumla sınırlandırılır."
      >
        <form
          action={routes.admin.users}
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_220px_180px_120px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Kullanıcı ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Kullanıcı ara"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <label>
            <span className="sr-only">Rol</span>
            <select
              name="role"
              defaultValue={role ?? ""}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Tüm roller</option>
              {ROLE_FILTER_OPTIONS.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {getRoleLabel(roleOption)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Şube</span>
            <select
              name="sectionId"
              defaultValue={sectionId}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Tüm şubeler</option>
              {options.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {formatSectionOption(section)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Enrollment durumu</span>
            <select
              name="enrollmentStatus"
              defaultValue={enrollmentStatus ?? ""}
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-500"
            >
              <option value="">Tüm kayıt durumları</option>
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

        {memberships.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Ad Soyad</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Ders Grupları</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Kurum</th>
                    <th className="px-4 py-3">Güncellendi</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {memberships.map((membership) => (
                    <tr key={membership.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {getInitials(
                              membership.user.name,
                              membership.user.email,
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-950">
                              {membership.user.name ?? "İsimsiz kullanıcı"}
                            </p>
                            {membership.studentNo ? (
                              <p className="mt-1 text-xs text-neutral-500">
                                Öğrenci No: {membership.studentNo}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {membership.user.email}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatEnum(membership.role)}
                          tone={getRoleTone(membership.role)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {membership.role === MembershipRole.STUDENT ? (
                          <EnrollmentList
                            enrollments={membership.enrollments}
                          />
                        ) : (
                          formatMembershipScope(membership)
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatEnum(membership.user.status)}
                          tone={getStatusTone(membership.user.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {membership.organization.name}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTr(membership.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <ButtonLink
                          href={`/admin/users/${membership.id}/edit`}
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
              {memberships.map((membership) => (
                <article
                  key={membership.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                      {getInitials(
                        membership.user.name,
                        membership.user.email,
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950">
                        {membership.user.name ?? "İsimsiz kullanıcı"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {membership.user.email}
                      </p>
                      {membership.studentNo ? (
                        <p className="mt-1 text-sm text-neutral-500">
                          Öğrenci No: {membership.studentNo}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          label={formatEnum(membership.role)}
                          tone={getRoleTone(membership.role)}
                        />
                        <StatusBadge
                          label={formatEnum(membership.user.status)}
                          tone={getStatusTone(membership.user.status)}
                        />
                      </div>
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-neutral-700">
                          Ders Grupları
                        </p>
                        {membership.role === MembershipRole.STUDENT ? (
                          <EnrollmentList
                            enrollments={membership.enrollments}
                          />
                        ) : (
                          <p className="text-sm text-neutral-500">
                            {formatMembershipScope(membership)}
                          </p>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-neutral-500">
                        Güncellendi {formatDateTr(membership.updatedAt)}
                      </p>
                      <div className="mt-4">
                        <ButtonLink
                          href={`/admin/users/${membership.id}/edit`}
                          icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                        >
                          Düzenle
                        </ButtonLink>
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
              hasFilters
                ? "Filtrelerle eşleşen kullanıcı yok"
                : "Bağlı kullanıcı yok"
            }
            description={
              hasFilters
                ? "Farklı bir arama terimi deneyin veya filtreleri temizleyin."
                : "Kurum üyelik kayıtları oluşturulduğunda üyeler burada görünecek."
            }
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.usersNew}
            actionLabel="Yeni Kullanıcı Ekle"
          />
        )}
      </SectionCard>
    </>
  );
}
