import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  ListChecks,
  Plus,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { AttendanceRecordStatus } from "@/lib/generated/prisma/enums";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorDashboardData } from "@/lib/instructor/queries";
import {
  formatDateTimeTr,
  getAttendanceAlertTypeLabel,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CLOSED") return "neutral" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "SCHEDULED" || status === "DRAFT") return "warning" as const;
  return "info" as const;
}

function getAcceptedRecordCount(records: Array<{ status: string }>) {
  return records.filter(
    (record) =>
      record.status === AttendanceRecordStatus.PRESENT ||
      record.status === AttendanceRecordStatus.LATE ||
      record.status === AttendanceRecordStatus.MANUAL,
  ).length;
}

function formatRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatSectionLabel(session: {
  section: {
    name: string;
    code: string | null;
    course: {
      code: string;
    };
  };
}) {
  return session.section.code
    ? `${session.section.course.code} · ${session.section.code}`
    : `${session.section.course.code} · ${session.section.name}`;
}

const quickActions = [
  {
    title: "Yeni Yoklama Oluştur",
    description: "Aktif bir oturum başlatıp QR paneline geçin.",
    href: routes.instructor.sessionCreate,
    icon: <Plus className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Öğrenci Yönetimi",
    description: "Şube kayıtlarını ve öğrenci listesini yönetin.",
    href: routes.instructor.students,
    icon: <Users className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Yoklama Oturumları",
    description: "Geçmiş ve aktif yoklamaları inceleyin.",
    href: routes.instructor.sessions,
    icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Raporlar",
    description: "Session detayındaki rapor ve CSV export ekranını açın.",
    href: routes.instructor.reports,
    icon: <FileBarChart className="h-4 w-4" aria-hidden="true" />,
  },
];

export default async function InstructorDashboardPage() {
  const authContext = await requireInstructorAuthContext();
  const data = await getInstructorDashboardData(authContext);
  const latestSession = data.recentSessions[0] ?? null;
  const latestSessionTotal = latestSession?.section._count.enrollments ?? 0;
  const latestSessionAccepted = latestSession
    ? getAcceptedRecordCount(latestSession.attendanceRecords)
    : 0;
  const latestAttendanceRate = latestSession
    ? formatRate(latestSessionAccepted, latestSession.section._count.enrollments)
    : "0%";

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğretmen Paneli"
        description="Size atanmış yoklama oturumları ve canlı yoklama durumu."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Bugünkü Oturumlar"
          value={String(data.todaySessionsCount)}
          description="Bugün başlayan yoklama oturumları."
          icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Aktif Yoklamalar"
          value={String(data.activeSessionsCount)}
          description="Şu anda aktif işaretlenen oturumlar."
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Toplam Öğrenci"
          value={String(data.totalStudents)}
          description="Ders gruplarınızdaki benzersiz öğrenciler."
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Toplam Ders/Şube"
          value={String(data.totalSections)}
          description="Size atanmış ders grubu sayısı."
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          tone="neutral"
        />
        <StatCard
          label="Son Katılım Oranı"
          value={latestAttendanceRate}
          trend={
            latestSession ? `${latestSessionAccepted}/${latestSessionTotal}` : "0/0"
          }
          description="Son oturumdaki katılan/geç katılan oranı."
          icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Son Güvenlik Uyarıları"
          value={String(data.recentSecurityAlerts.length)}
          description="Son şüpheli yoklama denemeleri."
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          tone={data.recentSecurityAlerts.length > 0 ? "warning" : "neutral"}
        />
      </section>

      <SectionCard
        title="Son Oturumlar"
        description="Size atanmış şubelerdeki son yoklama oturumları ve katılım oranları."
        actions={
          <ButtonLink href={routes.instructor.sessions} variant="ghost">
            Tümünü Gör
          </ButtonLink>
        }
      >
        {data.recentSessions.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Ders/Şube</th>
                  <th className="px-4 py-3">Başlangıç</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Katılan / Toplam</th>
                  <th className="px-4 py-3">Katılım Oranı</th>
                  <th className="px-4 py-3">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {data.recentSessions.map((session) => {
                  const acceptedCount = getAcceptedRecordCount(
                    session.attendanceRecords,
                  );
                  const totalStudents = session.section._count.enrollments;

                  return (
                    <tr key={session.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {formatSectionLabel(session)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {session.title}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTimeTr(session.startTime)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={getAttendanceSessionStatusLabel(
                            session.status,
                          )}
                          tone={getSessionTone(session.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {acceptedCount} / {totalStudents}
                      </td>
                      <td className="px-4 py-4 font-medium text-neutral-950">
                        {formatRate(acceptedCount, totalStudents)}
                      </td>
                      <td className="px-4 py-4">
                        <ButtonLink
                          href={`/instructor/sessions/${session.id}`}
                          variant="ghost"
                        >
                          Detaya Git
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Henüz oturum yok"
            description="Yeni yoklama oluşturduğunuzda son oturumlar burada görünecek."
            icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.instructor.sessionCreate}
            actionLabel="Yeni Yoklama Oluştur"
          />
        )}
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard
          title="Hızlı İşlemler"
          description="Demo akışında en sık kullanılan öğretmen işlemleri."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <ButtonLink
                key={action.title}
                href={action.href}
                variant="secondary"
                icon={action.icon}
                className="h-auto justify-start p-4"
              >
                <span className="text-left">
                  <span className="block font-medium">{action.title}</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">
                    {action.description}
                  </span>
                </span>
              </ButtonLink>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Son Güvenlik Uyarıları"
          description="Konum, token ve tekrar deneme kaynaklı son olaylar."
        >
          {data.recentSecurityAlerts.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.recentSecurityAlerts.map((alert) => (
                <div key={alert.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-neutral-950">
                    {getAttendanceAlertTypeLabel(alert.alertType)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {alert.studentUser?.name ?? "Bilinmeyen öğrenci"} ·{" "}
                    {alert.studentUser?.email ?? "E-posta yok"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatSectionLabel(alert.attendanceSession)} ·{" "}
                    {formatDateTimeTr(alert.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Güvenlik uyarısı yok"
              description="Şüpheli denemeler oluştuğunda burada görünecek."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>
    </>
  );
}
