import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="py-8">
        <StatusBadge label="Türkiye için QR yoklama" tone="success" />
        <div className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
            Attendly
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Okullar, kurslar ve kurum içi eğitimler için QR, öğrenci kimliği
            ve konum doğrulamasını birleştiren yoklama yönetimi.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={routes.public.login}
            className="rounded-md bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Giriş Yap
          </Link>
          <Link
            href={routes.public.features}
            className="rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            Özellikleri Gör
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Rol Alanları"
          value="3"
          description="Yönetim, öğretmen ve öğrenci alanları."
        />
        <StatCard
          label="Uygulama Rotaları"
          value="15"
          description="Herkese açık, giriş ve korumalı alanlar."
        />
        <StatCard
          label="İş Akışı"
          value="Canlı"
          description="QR, konum doğrulama ve güvenlik uyarıları."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Çalışma Alanları"
          description="Rol bazlı alanlar giriş koruması ile ayrıştırıldı."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={routes.admin.dashboard}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Yönetim
            </Link>
            <Link
              href={routes.instructor.dashboard}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Öğretmen
            </Link>
            <Link
              href={routes.student.scan}
              className="rounded-lg border border-neutral-200 p-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              Öğrenci
            </Link>
          </div>
        </SectionCard>
        <SectionCard title="Mevcut Kapsam">
          <EmptyState
            title="Temel akış hazır"
            description="Oturum oluşturma, QR üretimi, öğrenci check-in, konum doğrulama, rapor ve CSV export akışı hazır."
          />
        </SectionCard>
      </section>
    </div>
  );
}
