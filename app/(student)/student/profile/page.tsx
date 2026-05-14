import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function StudentProfilePage() {
  return (
    <>
      <PageHeader
        title="Profil"
        description="Kimlik, kayıt ve yoklama tercihleri için öğrenci profil temeli."
      />

      <SectionCard
        title="Profil Bilgileri"
        description="Giriş ve kurum modelinden gelecek kullanıcı profil verileri için hazırlandı."
      >
        <EmptyState
          title="Profil bağlı değil"
          description="Profil bilgileri öğrenci üyeliği ve kimlik akışı genişletildiğinde eklenecek."
        />
      </SectionCard>
    </>
  );
}
