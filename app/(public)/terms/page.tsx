import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Koşullar"
        description="Attendly demo kullanımında geçerli temel sorumluluklar."
      />
      <SectionCard title="Hizmet Koşulları Özeti">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly çalışma alanlarında kullanıcılar yalnızca kendi kurumları
            ve rolleri kapsamında yetkili oldukları ekranlara erişebilir.
            Yoklama verileri ders, şube ve oturum bağlamında tutulur.
          </p>
          <p>
            QR bağlantıları, konum doğrulaması ve güvenlik uyarıları demo
            amacıyla hazırlanmıştır. Canlı kullanımda kurum politikaları ve
            yerel mevzuat gereksinimleri ayrıca değerlendirilmelidir.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
