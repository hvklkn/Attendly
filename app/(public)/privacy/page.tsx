import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Privacy"
        description="A placeholder for Attendly privacy commitments and data handling details."
      />
      <SectionCard title="Privacy policy placeholder">
        <div className="space-y-4 text-sm leading-7 text-neutral-600">
          <p>
            Attendly will document how workspace, session, attendance, and user
            profile data are collected and protected before production launch.
          </p>
          <p>
            This page is intentionally lightweight until legal, compliance, and
            product data flows are finalized.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
