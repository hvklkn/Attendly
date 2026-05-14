import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function StudentAttendancePage() {
  return (
    <>
      <PageHeader
        title="Yoklama Geçmişi"
        description="Öğrenciye ait yoklama ve katılım kayıtları."
      />

      <SectionCard
        title="Geçmiş"
        description="Öğrencinin yoklama kayıtları için zaman çizelgesi alanı."
      >
        <EmptyState
          title="Yoklama kaydı yok"
          description="Oturumlar, yoklama katılımı ve öğrenci kimliği bağlandığında yoklama geçmişi burada görünecek."
        />
      </SectionCard>
    </>
  );
}
