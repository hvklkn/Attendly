import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { routes } from "@/constants/routes";
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Toplam Oturum"
          value={String(data.totalSessions)}
          description="Öğretmeni olduğunuz ders gruplarına bağlı oturumlar."
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
          label="Ders Gruplarım"
          value={String(data.totalSections)}
          description="Size atanmış aktif ve pasif ders grupları."
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          tone="neutral"
        />
        <StatCard
          label="Öğrencilerim"
          value={String(data.totalStudents)}
          description="Ders gruplarınızdaki benzersiz öğrenciler."
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          tone="success"
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
        title="Ders Gruplarım"
        description="Öğretmeni olduğunuz ders grupları, öğrenci sayıları ve oturum kapsamı."
        actions={
          <ButtonLink
            href={routes.instructor.students}
            variant="ghost"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          >
            Öğrencileri Aç
          </ButtonLink>
        }
      >
        {data.sections.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.sections.map((section) => {
              const sectionName = section.code
                ? `${section.code} · ${section.name}`
                : section.name;

              return (
                <article
                  key={section.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="font-medium text-neutral-950">
                    {section.course.code} · {sectionName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {section.course.title}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-neutral-500">Öğrenci</dt>
                      <dd className="mt-1 font-semibold text-neutral-950">
                        {section._count.enrollments}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Oturum</dt>
                      <dd className="mt-1 font-semibold text-neutral-950">
                        {section._count.attendanceSessions}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Bu öğretmene ait ders grubu bulunamadı"
            description="Kurum yöneticiniz ders grubu ataması yaptığında oturumlar ve öğrenciler burada görünecek."
            icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Öğretmen Çalışma Alanı"
        description="QR oluşturma ve oturum takibi için hızlı başlangıç."
      >
        <EmptyState
          title="Oturumlar sayfasından devam edin"
          description="Canlı QR oluşturmak veya oturum ayrıntılarını görmek için size atanmış yoklama oturumlarını açın."
        />
      </SectionCard>

      <SectionCard
        title="Öğrenci Yönetimi"
        description="Öğretmenler yalnızca kendi ders gruplarındaki öğrenci kapsamıyla çalışacak."
      >
        <EmptyState
          title="Öğrenciler sayfasından devam edin"
          description="Kendi ders gruplarınıza kayıtlı öğrencileri görebilir ve yeni öğrenci ekleyebilirsiniz. CSV aktarımı sonraki adımda eklenecek."
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          actionHref={routes.instructor.students}
          actionLabel="Öğrencileri Aç"
        />
      </SectionCard>
    </>
  );
}
