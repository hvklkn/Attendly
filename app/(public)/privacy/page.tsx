import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Gizlilik"
        description="Attendly'nin veri işleme ve gizlilik ilkeleri için hazırlık sayfası."
      />
      <SectionCard title="Gizlilik Politikası Hazırlığı">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly, kurum, oturum, yoklama ve kullanıcı profil verilerinin
            nasıl toplandığını ve korunduğunu üretim kullanımı öncesinde açıkça
            belgeleyecek.
          </p>
          <p>
            Hukuki, uyumluluk ve ürün veri akışları netleşene kadar bu sayfa
            sade tutulur.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
