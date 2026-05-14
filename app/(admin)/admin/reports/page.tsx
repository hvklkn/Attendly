import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  ListChecks,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminReportsData } from "@/lib/admin/queries";
import {
  getAttendanceRecordStatusLabel,
  getRoleLabel,
} from "@/lib/localization";

const reportCards = [
  {
    title: "Yoklama Özeti",
    description: "Oturum bazında katıldı, geç katıldı, katılmadı ve mazeretli toplamları.",
    status: "Veriye hazır",
    icon: <FileBarChart className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Katılım Eğilimleri",
    description: "Ders, şube ve dönem bazında katılım eğilimleri.",
    status: "Planlandı",
    icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    title: "Dışa Aktarım Paketi",
    description: "Akademik veya eğitim operasyonları için CSV uyumlu kayıtlar.",
    status: "Planlandı",
    icon: <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />,
  },
];

function formatEnum(value: string) {
  if (
    value === "SUPER_ADMIN" ||
    value === "ORG_ADMIN" ||
    value === "INSTRUCTOR" ||
    value === "STUDENT"
  ) {
    return getRoleLabel(value);
  }

  return getAttendanceRecordStatusLabel(value);
}

function getRoleTone(role: string) {
  if (role === "ORG_ADMIN" || role === "SUPER_ADMIN") return "info" as const;
  if (role === "INSTRUCTOR") return "success" as const;
  return "neutral" as const;
}

function getAttendanceTone(status: string) {
  if (status === "PRESENT" || status === "LATE" || status === "MANUAL") {
    return "success" as const;
  }

  if (status === "ABSENT" || status === "REJECTED") {
    return "danger" as const;
  }

  return "info" as const;
}

function getPercent(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export default async function AdminReportsPage() {
  const authContext = await requireAdminAuthContext();
  const data = await getAdminReportsData(authContext);

  const summaryStats = [
    {
      label: "Toplam Oturum",
      value: String(data.totalSessions),
      trend: "Tüm zamanlar",
      description: "Aktif kurumdaki yoklama oturumları.",
      icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
      tone: "info" as const,
    },
    {
      label: "Kapanan Oturum",
      value: String(data.completedSessions),
      trend: "Kapandı",
      description: "Kapalı duruma geçen oturumlar.",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      tone: "success" as const,
    },
    {
      label: "Üyeler",
      value: String(data.totalMembers),
      trend: "Kurum kapsamı",
      description: "Raporlar için kullanılabilir üyelik kayıtları.",
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      tone: "neutral" as const,
    },
    {
      label: "Yoklama Kayıtları",
      value: String(data.attendanceRecords),
      trend: data.attendanceRecords > 0 ? "Kayıtlı" : "Henüz yok",
      description: "Özetleme için kullanılabilir ham yoklama kayıtları.",
      icon: <ListChecks className="h-4 w-4" aria-hidden="true" />,
      tone: "warning" as const,
    },
  ];

  const maxMembershipCount = Math.max(
    ...data.membershipCounts.map((item) => item._count._all),
    1,
  );

  return (
    <>
      <PageHeader
        eyebrow="Raporlama"
        title="Raporlar"
        description="Yoklama sonuçları, üyeler ve dışa aktarıma hazır özetler."
      >
        <StatusBadge label="Salt okunur" tone="info" />
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Oturum Sonuçları"
          description="Kurum kapsamındaki kayıtlardan oturum yaşam döngüsü sayıları."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Yaklaşan",
                value: data.upcomingSessions,
                tone: "info" as const,
              },
              {
                label: "Kapandı",
                value: data.completedSessions,
                tone: "success" as const,
              },
              {
                label: "İptal Edildi",
                value: data.cancelledSessions,
                tone: "danger" as const,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <StatusBadge label={item.label} tone={item.tone} />
                <p className="mt-4 text-3xl font-semibold text-neutral-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Dışa Aktarım Kuyruğu"
          description="Arka plan işleriyle üretilen raporlar ileride burada izlenecek."
        >
          <EmptyState
            title="Dışa aktarım yok"
            description="CSV ve PDF dışa aktarım işleri rapor üretimi bağlandığında burada görünecek."
            icon={<Download className="h-5 w-5" aria-hidden="true" />}
          />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Rol Dağılımı"
          description="Aktif kurumdaki role göre üyelik sayıları."
        >
          {data.membershipCounts.length > 0 ? (
            <div className="space-y-4">
              {data.membershipCounts.map((item) => {
                const count = item._count._all;
                const width = getPercent(count, maxMembershipCount);

                return (
                  <div key={item.role}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <StatusBadge
                        label={formatEnum(item.role)}
                        tone={getRoleTone(item.role)}
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-neutral-900"
                        style={{ width: `${Math.max(width, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Raporlanacak üye yok"
              description="Kurum üyelikleri olduğunda rol dağılımı burada görünecek."
              icon={<Users className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Duruma Göre Yoklama Kayıtları"
          description="Saklanan yoklama kayıtlarının duruma göre sayıları."
        >
          {data.attendanceStatusCounts.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.attendanceStatusCounts.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <StatusBadge
                    label={formatEnum(item.status)}
                    tone={getAttendanceTone(item.status)}
                  />
                  <span className="text-sm font-semibold text-neutral-950">
                    {item._count._all}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Yoklama kaydı yok"
              description="Yoklama katılımı veya manuel kayıt verisi oluştuktan sonra durum özetleri burada görünecek."
              icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Rapor Kütüphanesi"
        description="Gelecek veri kaynakları için hazırlanmış yeniden kullanılabilir rapor alanları."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {reportCards.map((report) => (
            <div
              key={report.title}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-neutral-600 shadow-subtle">
                  {report.icon}
                </div>
                <StatusBadge
                  label={report.status}
                  tone={report.status === "Veriye hazır" ? "info" : "warning"}
                />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-950">
                {report.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {report.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Rapor Filtreleri"
        description="Tarih aralığı, ders, şube ve durum filtreleri rapor üretim akışı için ayrıldı."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Tarih aralığı", "Ders", "Şube", "Yoklama durumu"].map(
            (filter) => (
              <div
                key={filter}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
              >
                <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
                  {filter}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  Planlandı
                </p>
              </div>
            ),
          )}
        </div>
      </SectionCard>
    </>
  );
}
