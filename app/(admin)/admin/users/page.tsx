import { FileUp, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminUsersData } from "@/lib/admin/queries";
import { MembershipRole } from "@/lib/generated/prisma/enums";
import {
  formatDateTr,
  getRoleLabel,
  getUserStatusLabel,
} from "@/lib/localization";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    role?: string | string[];
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

function formatDate(date: Date) {
  return formatDateTr(date);
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

function formatMembershipScope(membership: {
  role: string;
  enrollments: Array<{
    section: {
      name: string;
      code: string | null;
      course: {
        code: string;
      };
    };
  }>;
  _count: {
    enrollments: number;
    instructedSections: number;
  };
}) {
  if (membership.role === MembershipRole.INSTRUCTOR) {
    return `${membership._count.instructedSections} ders grubu`;
  }

  if (membership.role !== MembershipRole.STUDENT) {
    return "Kurum kapsamı";
  }

  if (membership.enrollments.length === 0) {
    return "Ders grubu yok";
  }

  const visibleSections = membership.enrollments.map((enrollment) => {
    const section = enrollment.section;
    const sectionName = section.code
      ? `${section.code}`
      : section.name;

    return `${section.course.code} · ${sectionName}`;
  });
  const remainingCount = Math.max(
    membership._count.enrollments - visibleSections.length,
    0,
  );

  return remainingCount > 0
    ? `${visibleSections.join(", ")} +${remainingCount}`
    : visibleSections.join(", ");
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const role = getRoleFilterValue(resolvedSearchParams?.role);
  const memberships = await getAdminUsersData(authContext, { query, role });

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
          variant="primary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrenci Ekle
        </ButtonLink>
      </PageHeader>

      <SectionCard
        title="Toplu Aktarım"
        description="Öğrenci listesini CSV dosyasıyla toplu olarak aktarabileceksiniz."
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
          CSV aktarımı sonraki adımda eklenecek. Bu temel sayesinde öğrenciler
          tek tek oluşturulabilir, toplu yükleme aynı üyelik kurallarını
          kullanacak şekilde hazırlanabilir.
        </p>
      </SectionCard>

      <SectionCard
        title="Kullanıcı Listesi"
        description="Üyelik kayıtları kullanıcı detayları seçilmeden önce geçerli kurumla sınırlandırılır."
      >
        <form
          action={routes.admin.users}
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_120px]"
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
                        {formatMembershipScope(membership)}
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
                        {formatDate(membership.updatedAt)}
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
                      <p className="mt-3 text-xs text-neutral-500">
                        {formatMembershipScope(membership)}
                      </p>
                      <p className="mt-3 text-xs text-neutral-500">
                        Güncellendi {formatDate(membership.updatedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? "Aramanızla eşleşen kullanıcı yok" : "Bağlı kullanıcı yok"}
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Kurum üyelik kayıtları oluşturulduğunda üyeler burada görünecek."
            }
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
