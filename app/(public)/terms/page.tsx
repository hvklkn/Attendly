import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Koşullar"
        description="Attendly hizmet koşulları ve kabul edilebilir kullanım bilgileri için hazırlık sayfası."
      />
      <SectionCard title="Hizmet Koşulları Hazırlığı">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly, çalışma alanı sahipliği, kabul edilebilir kullanım, hesap
            sorumlulukları ve hizmet sınırlarını üretim kullanımı öncesinde
            tanımlayacak.
          </p>
          <p>
            Bu sayfa, herkese açık rota yapısı tamamlanmış olsun ve incelenmiş
            metinlerle kolayca değiştirilebilsin diye hazırlanmıştır.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
