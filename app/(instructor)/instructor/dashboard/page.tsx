import { CalendarClock, CheckCircle2, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { requireInstructorAuthContext } from "@/lib/instructor/auth";
import { getInstructorDashboardData } from "@/lib/instructor/queries";

export default async function InstructorDashboardPage() {
  const authContext = await requireInstructorAuthContext();
  const data = await getInstructorDashboardData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğretmen Paneli"
        description="Size atanmış yoklama oturumları ve canlı yoklama durumu."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Toplam Oturum"
          value={String(data.totalSessions)}
          description="Öğretmeni olduğunuz şubelere bağlı oturumlar."
          icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Yaklaşan Oturum"
          value={String(data.upcomingSessionsCount)}
          description="Planlanan veya aktif zaman pencereleri."
          icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
          tone="warning"
        />
        <StatCard
          label="Aktif Yoklama"
          value={String(data.activeSessionsCount)}
          description="Şu anda aktif işaretlenen oturumlar."
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          tone="success"
        />
      </section>

      <SectionCard
        title="Öğretmen Çalışma Alanı"
        description="QR oluşturma ve oturum takibi için hızlı başlangıç."
      >
        <EmptyState
          title="Oturumlar sayfasından devam edin"
          description="Canlı QR oluşturmak veya oturum ayrıntılarını görmek için size atanmış yoklama oturumlarını açın."
        />
      </SectionCard>
    </>
  );
}
