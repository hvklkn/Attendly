import { CalendarDays, Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorSessionsData } from "@/lib/instructor/queries";
import {
  formatDateTimeTr,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";

type InstructorSessionsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  if (status === "CLOSED") return "neutral" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}

export default async function InstructorSessionsPage({
  searchParams,
}: InstructorSessionsPageProps) {
  const authContext = await requireInstructorAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const sessions = await getInstructorSessionsData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Yoklama Oturumları"
        description="Size atanmış şubelerdeki yoklama oturumlarını yönetin."
      >
        <ButtonLink
          href={routes.instructor.sessionCreate}
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Yeni Yoklama Oluştur
        </ButtonLink>
      </PageHeader>

      <SectionCard
        title="Oturumlarım"
        description="Yalnızca öğretmeni olduğunuz şubelere bağlı oturumlar gösterilir."
      >
        <form
          action={routes.instructor.sessions}
          className="mb-5 grid gap-3 sm:grid-cols-[1fr_140px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Oturum ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Oturum ara"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Ara
          </button>
        </form>

        {sessions.length > 0 ? (
          <div className="grid gap-3">
            {sessions.map((session) => {
              const section = session.section.code
                ? `${session.section.course.code} - ${session.section.code}`
                : `${session.section.course.code} - ${session.section.name}`;
              const latestQrToken = session.qrTokens[0] ?? null;

              return (
                <article
                  key={session.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-neutral-950">
                          {session.title}
                        </h2>
                        <StatusBadge
                          label={getAttendanceSessionStatusLabel(session.status)}
                          tone={getSessionTone(session.status)}
                        />
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">{section}</p>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-neutral-500">Başlangıç</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {formatDateTimeTr(session.startTime)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Oda</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {session.room?.name ?? "Atanmadı"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Yoklama</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {session._count.attendanceRecords} kayıt
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs text-neutral-500">
                        {latestQrToken
                          ? `Son QR: ${formatDateTimeTr(latestQrToken.createdAt)}`
                          : "Henüz QR oluşturulmadı"}
                      </p>
                    </div>

                    <ButtonLink
                      href={`/instructor/sessions/${session.id}`}
                      className="w-full md:w-auto"
                    >
                      Oturumu Aç
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={
              query
                ? "Aramanızla eşleşen oturum yok"
                : "Atanmış oturum bulunmuyor"
            }
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Öğretmeni olduğunuz şubelerde oturum oluşturulduğunda burada görünecek."
            }
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
