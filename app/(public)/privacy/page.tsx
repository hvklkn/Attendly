import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Gizlilik"
        description="Attendly demo uygulamasında işlenen veriler ve temel gizlilik yaklaşımı."
      />
      <SectionCard title="Gizlilik Özeti">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly; kurum, kullanıcı, ders, şube, yoklama oturumu, QR token
            ve konum doğrulama verilerini yalnızca yoklama akışını işletmek ve
            raporlamak için kullanır.
          </p>
          <p>
            Konum bilgisi yoklama sırasında alınır, mesafe ve doğruluk
            hesaplaması için saklanır ve güvenlik uyarılarıyla birlikte kurum
            kapsamındaki yetkili kullanıcılar tarafından görüntülenir.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
