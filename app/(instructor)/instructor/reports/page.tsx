import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  ListChecks,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import {
  getInstructorReportsOptions,
  getInstructorSectionReportData,
  normalizeInstructorReportsFilters,
} from "@/lib/instructor/reports";
import { getAttendanceSessionStatusLabel } from "@/lib/localization";
import { InstructorSectionReportExportButton } from "./InstructorSectionReportExportButton";

type InstructorReportsPageProps = {
  searchParams?: Promise<{
    courseId?: string | string[];
    sectionId?: string | string[];
    from?: string | string[];
    to?: string | string[];
    status?: string | string[];
    student?: string | string[];
  }>;
};

const inputClassName =
  "mt-2 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CLOSED") return "neutral" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "DRAFT" || status === "SCHEDULED") return "warning" as const;
  return "info" as const;
}

function createReportFileName(sectionLabel: string) {
  const normalizedLabel = sectionLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedLabel || "sube"}-devam-raporu.csv`;
}

export default async function InstructorReportsPage({
  searchParams,
}: InstructorReportsPageProps) {
  const [authContext, resolvedSearchParams] = await Promise.all([
    requireInstructorAuthContext(),
    searchParams,
  ]);
  const filters = normalizeInstructorReportsFilters(resolvedSearchParams ?? {});
  const options = await getInstructorReportsOptions(authContext);
  const filteredSections = filters.courseId
    ? options.sections.filter((section) => section.courseId === filters.courseId)
    : options.sections;
  const selectedSection = options.sections.find(
    (section) => section.id === filters.sectionId,
  );
  const report = await getInstructorSectionReportData(authContext, filters);
  const hasSections = options.sections.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Devam Raporları"
        description="Ders/şube bazında tüm yoklama geçmişi, öğrenci devam durumu ve oturum performansı."
      />

      <SectionCard
        title="Rapor Filtreleri"
        description="Önce ders ve şube seçin; tarih, oturum durumu ve öğrenci aramasıyla raporu daraltın."
      >
        <form
          action={routes.instructor.reports}
          className="grid gap-4 xl:grid-cols-[1fr_1fr_150px_150px_150px_1fr_110px]"
        >
          <div>
            <label
              htmlFor="courseId"
              className="text-sm font-medium text-neutral-700"
            >
              Ders
            </label>
            <select
              id="courseId"
              name="courseId"
              defaultValue={filters.courseId}
              className={inputClassName}
            >
              <option value="">Tüm dersler</option>
              {options.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sectionId"
              className="text-sm font-medium text-neutral-700"
            >
              Şube
            </label>
            <select
              id="sectionId"
              name="sectionId"
              defaultValue={filters.sectionId}
              className={inputClassName}
            >
              <option value="">Şube seçin</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.course.code} - {section.code ?? section.name} (
                  {section.activeStudentCount} öğrenci)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="from"
              className="text-sm font-medium text-neutral-700"
            >
              Başlangıç
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={filters.from}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="to" className="text-sm font-medium text-neutral-700">
              Bitiş
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={filters.to}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="text-sm font-medium text-neutral-700"
            >
              Oturum durumu
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status}
              className={inputClassName}
            >
              <option value="all">Tümü</option>
              <option value="ACTIVE">Aktif</option>
              <option value="CLOSED">Kapandı</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="student"
              className="text-sm font-medium text-neutral-700"
            >
              Öğrenci
            </label>
            <input
              id="student"
              name="student"
              defaultValue={filters.student}
              placeholder="Ad veya email ara"
              className={inputClassName}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Getir
            </button>
          </div>
        </form>
      </SectionCard>

      {!hasSections ? (
        <EmptyState
          title="Raporlanacak şube yok"
          description="Size atanmış aktif ders/şube olduğunda genel devam raporları burada kullanılabilir."
          icon={<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />}
        />
      ) : !filters.sectionId ? (
        <EmptyState
          title="Raporu görmek için ders/şube seçin"
          description="Bir şube seçtiğinizde öğrencilerin tüm yoklama geçmişi ve devam oranları hesaplanır."
          icon={<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />}
        />
      ) : !report ? (
        <EmptyState
          title="Bu filtrelerle rapor bulunamadı"
          description="Seçilen ders/şube size atanmış olmayabilir veya filtreler eşleşen veri döndürmüyor."
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Toplam Yoklama Oturumu"
              value={String(report.summary.totalSessions)}
              description="Filtreye uyan oturum sayısı."
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
              tone="info"
            />
            <StatCard
              label="Toplam Aktif Öğrenci"
              value={String(report.summary.totalActiveStudents)}
              description="Filtreye uyan aktif enrollment sayısı."
              icon={<Users className="h-4 w-4" aria-hidden="true" />}
              tone="neutral"
            />
            <StatCard
              label="Ortalama Katılım Oranı"
              value={report.summary.averageAttendanceRate}
              description="Katıldı ve geç katıldı toplamının olası yoklamalara oranı."
              icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
              tone="success"
            />
            <StatCard
              label="Toplam Katılım"
              value={String(report.summary.totalAttendance)}
              description="PRESENT + LATE kayıt toplamı."
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              tone="success"
            />
            <StatCard
              label="Toplam Geç Katılım"
              value={String(report.summary.totalLateAttendance)}
              description="Geç kalma eşiğinden sonra alınan kayıtlar."
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
              tone="warning"
            />
            <StatCard
              label="Toplam Katılmama"
              value={String(report.summary.totalAbsence)}
              description="Aktif enrollment olup oturumda kaydı olmayanlar."
              icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
              tone="warning"
            />
            <StatCard
              label="Toplam Reddedilen Deneme"
              value={String(report.summary.totalRejected)}
              description="Katılım sayılmayan reddedilen kayıtlar."
              icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
              tone="danger"
            />
            <StatCard
              label="Toplam Güvenlik Uyarısı"
              value={String(report.summary.totalSecurityAlerts)}
              description="Seçilen oturumlarda oluşan güvenlik uyarıları."
              icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
              tone={
                report.summary.totalSecurityAlerts > 0 ? "warning" : "neutral"
              }
            />
          </section>

          <SectionCard
            title="Öğrenci Devam Raporu"
            description={`${report.courseTitle} / ${report.sectionLabel} için öğrenci bazlı devam durumu.`}
            actions={
              <InstructorSectionReportExportButton
                rows={report.studentRows}
                fileName={createReportFileName(report.sectionLabel)}
              />
            }
          >
            {report.studentRows.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 xl:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Öğrenci adı</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Kayıtlı olduğu şube</th>
                        <th className="px-4 py-3">Toplam oturum</th>
                        <th className="px-4 py-3">Katıldı</th>
                        <th className="px-4 py-3">Geç katıldı</th>
                        <th className="px-4 py-3">Katılmadı</th>
                        <th className="px-4 py-3">Reddedilen</th>
                        <th className="px-4 py-3">Devam oranı %</th>
                        <th className="px-4 py-3">Son katılım zamanı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {report.studentRows.map((row) => (
                        <tr key={row.email}>
                          <td className="px-4 py-4 font-medium text-neutral-950">
                            {row.studentName}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.email}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.sectionLabel}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.totalSessions}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.presentCount}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.lateCount}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.absentCount}
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.rejectedCount}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge
                              label={row.attendanceRate}
                              tone={
                                Number(row.attendanceRate.replace("%", "")) >=
                                70
                                  ? "success"
                                  : "warning"
                              }
                            />
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {row.lastAttendanceAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 xl:hidden">
                  {report.studentRows.map((row) => (
                    <article
                      key={row.email}
                      className="rounded-lg border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-950">
                            {row.studentName}
                          </p>
                          <p className="mt-1 truncate text-sm text-neutral-500">
                            {row.email}
                          </p>
                        </div>
                        <StatusBadge
                          label={row.attendanceRate}
                          tone={
                            Number(row.attendanceRate.replace("%", "")) >= 70
                              ? "success"
                              : "warning"
                          }
                        />
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-neutral-500">Şube</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.sectionLabel}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Toplam oturum</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.totalSessions}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Katıldı</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.presentCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Geç katıldı</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.lateCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Katılmadı</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.absentCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Reddedilen</dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.rejectedCount}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-neutral-500">
                            Son katılım zamanı
                          </dt>
                          <dd className="mt-1 font-medium text-neutral-900">
                            {row.lastAttendanceAt}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="Bu filtreyle öğrenci bulunamadı"
                description="Öğrenci aramasını temizleyin veya farklı bir şube seçin."
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Oturum Listesi"
            description="Seçilen şubenin filtreye uyan yoklama oturumları."
          >
            {report.sessionRows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Ders/Şube</th>
                      <th className="px-4 py-3">Oturum</th>
                      <th className="px-4 py-3">Başlangıç</th>
                      <th className="px-4 py-3">Bitiş</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Katılan / Toplam</th>
                      <th className="px-4 py-3">Katılım oranı</th>
                      <th className="px-4 py-3">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {report.sessionRows.map((session) => (
                      <tr key={session.id}>
                        <td className="px-4 py-4 text-neutral-600">
                          {session.courseSection}
                        </td>
                        <td className="px-4 py-4 font-medium text-neutral-950">
                          {session.title}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {session.startTime}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {session.endTime}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            label={session.statusLabel}
                            tone={getSessionTone(session.status)}
                          />
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {session.acceptedCount} / {session.totalStudents}
                        </td>
                        <td className="px-4 py-4 font-medium text-neutral-950">
                          {session.attendanceRate}
                        </td>
                        <td className="px-4 py-4">
                          <ButtonLink
                            href={session.detailHref}
                            variant="ghost"
                            icon={
                              <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            }
                          >
                            Detaya Git
                          </ButtonLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Bu filtreyle oturum bulunamadı"
                description="Tarih aralığını veya oturum durumu filtresini değiştirin."
                icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
              />
            )}
          </SectionCard>
        </>
      )}
    </>
  );
}
