import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileBarChart,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/queries";
import {
  formatDateTimeTr,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";

const quickActions = [
  {
    title: "Yoklama oturumu oluştur",
    description: "Bir şube için yoklama zaman aralığı hazırlayın.",
    href: routes.admin.sessionCreate,
    icon: <CalendarPlus className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Kullanıcıları görüntüle",
    description: "Yönetici, öğretmen ve öğrenci rollerini inceleyin.",
    href: routes.admin.users,
    icon: <UserPlus className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Raporları aç",
    description: "Yoklama özetlerini inceleyin.",
    href: routes.admin.reports,
    icon: <FileBarChart className="h-4 w-4" aria-hidden="true" />,
  },
];

const platformStatus = [
  { label: "Giriş sınırı", status: "Hazır", tone: "success" as const },
  { label: "Prisma şeması", status: "Hazır", tone: "success" as const },
  { label: "QR akışı", status: "Hazır", tone: "success" as const },
  { label: "Rapor motoru", status: "Planlandı", tone: "warning" as const },
];

function formatDateTime(date: Date) {
  return formatDateTimeTr(date);
}

function formatStatus(status: string) {
  return getAttendanceSessionStatusLabel(status);
}

function getSessionTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}

export default async function AdminDashboardPage() {
  const authContext = await requireAdminAuthContext();
  const data = await getAdminDashboardData(authContext);

  const overviewStats = [
    {
      label: "Toplam Oturum",
      value: String(data.totalSessions),
      trend: "Tüm zamanlar",
      description: "Bu kuruma ait yoklama oturumları.",
      icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Yaklaşan Oturum",
      value: String(data.upcomingSessionsCount),
      trend: "Planlandı",
      description: "Henüz kapanmamış veya iptal edilmemiş gelecek oturumlar.",
      icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Üyeler",
      value: String(data.totalMembers),
      trend: "Aktif kurum",
      description: "Geçerli kurumdaki üyelik kayıtları.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Katılım Oranı",
      value: data.attendanceRate === null ? "--" : `${data.attendanceRate}%`,
      trend: data.totalAttendanceRecords > 0 ? "Kayıtlı" : "Kayıt yok",
      description: "Katıldı, geç katıldı ve manuel kayıtların toplam içindeki oranı.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Panel"
        description="Oturumlar, kullanıcılar, raporlar ve çalışma alanı durumu için operasyon özeti."
      >
        <ButtonLink
          href={routes.admin.sessionCreate}
          variant="primary"
          icon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Yoklama Oturumu Oluştur
        </ButtonLink>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard
          title="Yaklaşan Oturumlar"
          description="Aktif kurum için sıradaki planlı oturumlar."
          actions={
            <ButtonLink
              href={routes.admin.sessions}
              variant="ghost"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Tümünü Gör
            </ButtonLink>
          }
        >
          {data.upcomingSessions.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_170px_150px_120px] md:items-center"
                >
                  <div>
                    <p className="font-medium text-neutral-950">
                      {session.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {session.section.course.code} · {session.section.name}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {formatDateTime(session.startTime)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {session.room?.name ?? "Oda yok"}
                  </p>
                  <StatusBadge
                    label={formatStatus(session.status)}
                    tone={getSessionTone(session.status)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Yaklaşan oturum yok"
              description="Gelecek yoklama oturumları oluşturulduktan sonra burada görünecek."
              icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
              actionHref={routes.admin.sessionCreate}
              actionLabel="Oturum oluştur"
            />
          )}
        </SectionCard>

        <SectionCard
          title="İnceleme Gerekiyor"
          description="Yoklama kayıtlarına dayalı salt okunur inceleme kuyruğu."
        >
          {data.needsReviewCount > 0 ? (
            <EmptyState
              title={`${data.needsReviewCount} kayıt inceleme bekliyor`}
              description="Reddedilen ve manuel yoklama kayıtları sonraki inceleme akışları için burada sayılır."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              actionHref={routes.admin.reports}
              actionLabel="Raporları aç"
            />
          ) : (
            <EmptyState
              title="İnceleme bekleyen kayıt yok"
              description="Reddedilen ve manuel yoklama kayıtları oluştuğunda burada görünecek."
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Hızlı İşlemler"
          description="Sık kullanılan yönetim giriş noktaları."
          className="lg:col-span-1"
        >
          <div className="divide-y divide-neutral-100">
            {quickActions.map((action) => (
              <ButtonLink
                key={action.title}
                href={action.href}
                variant="ghost"
                icon={action.icon}
                className="h-auto w-full justify-start rounded-none border-0 px-0 py-4 first:pt-0 last:pb-0"
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
          title="Son Etkinlik"
          description="Bu kuruma ait son denetim kayıtları."
          className="lg:col-span-1"
        >
          {data.recentAuditLogs.length > 0 ? (
            <div className="space-y-4">
              {data.recentAuditLogs.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {item.action}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.targetType}
                      {item.targetId ? ` · ${item.targetId}` : ""} ·{" "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : data.recentSessions.length > 0 ? (
            <div className="space-y-4">
              {data.recentSessions.map((session) => (
                <div key={session.id} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {session.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {session.section.course.code} · {session.section.name} ·{" "}
                      {formatDateTime(session.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Henüz etkinlik yok"
              description="Yönetici işlemleri kaydedildikten sonra denetim kayıtları burada görünecek."
              icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Sistem Durumu"
          description="Temel ürün alanlarının hazırlık durumu."
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            {platformStatus.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    {item.tone === "success" ? (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    {item.label}
                  </p>
                </div>
                <StatusBadge label={item.status} tone={item.tone} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </>
  );
}
