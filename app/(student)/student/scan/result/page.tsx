import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function StudentScanResultPage() {
  return (
    <>
      <PageHeader
        title="Okutma Sonucu"
        description="Başarılı, bekleyen veya başarısız yoklama katılımı durumları için sonuç alanı."
      />

      <SectionCard
        title="Yoklama Katılım Durumu"
        description="Kamera okutma akışı eklendiğinde QR doğrulama sonucu burada gösterilecek."
      >
        <div className="mb-5">
          <StatusBadge label="Uygulama bekliyor" tone="warning" />
        </div>
        <EmptyState
          title="Okutma sonucu yok"
          description="Sonuç mesajları QR doğrulaması ve yoklama kaydı oluşturma adımına daha sonra bağlanacak."
        />
      </SectionCard>
    </>
  );
}
