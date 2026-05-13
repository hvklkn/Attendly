import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const featureAreas = [
  "Multi-tenant workspace foundation",
  "Role-based route organization",
  "QR attendance flow placeholder",
  "Reporting area placeholder",
  "Mobile-friendly student surfaces",
  "Shared UI and layout primitives",
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Features"
        description="Attendly is structured for attendance workflows without locking the product into premature implementation details."
      />
      <SectionCard
        title="Planned product areas"
        description="These are scaffolding targets for future implementation."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureAreas.map((feature) => (
            <div
              key={feature}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <StatusBadge label="Planned" tone="info" />
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
