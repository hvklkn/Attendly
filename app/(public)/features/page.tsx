import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const featureAreas = [
  "Çok kiracılı kurum yapısı",
  "Rol bazlı uygulama alanları",
  "60 saniyelik canlı QR akışı",
  "Yoklama raporları temeli",
  "Mobil öğrenci doğrulama ekranları",
  "Paylaşılan arayüz bileşenleri",
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Özellikler"
        description="Attendly, QR kodu tek başına yeterli görmeyen güvenli yoklama akışları için yapılandırıldı."
      />
      <SectionCard
        title="Ürün Alanları"
        description="Bu alanlar kademeli olarak gerçek yoklama akışına bağlanacak."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureAreas.map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <StatusBadge label="Planlandı" tone="info" />
              <p className="mt-3 text-sm font-medium text-neutral-900">
                {feature}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
