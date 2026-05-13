import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Terms"
        description="A placeholder for Attendly service terms and acceptable use details."
      />
      <SectionCard title="Terms of service placeholder">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly will define workspace ownership, acceptable use, account
            responsibilities, and service limits before production launch.
          </p>
          <p>
            This page is prepared now so the public route structure is complete
            and easy to replace with reviewed terms later.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
