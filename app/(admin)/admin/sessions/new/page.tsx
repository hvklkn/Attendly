import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminCreateSessionPage() {
  return (
    <>
      <PageHeader
        title="Create Session"
        description="Form foundation for a future attendance session creation workflow."
      />

      <SectionCard
        title="Session details"
        description="Fields are placeholders until validation, ownership, and persistence are added."
      >
        <div className="mb-5">
          <StatusBadge label="Not connected" tone="warning" />
        </div>
        <form className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="session-title"
              className="text-sm font-medium text-neutral-700"
            >
              Title
            </label>
            <input
              id="session-title"
              type="text"
              disabled
              placeholder="Session title"
              className="mt-2 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
            />
          </div>
          <div>
            <label
              htmlFor="session-date"
              className="text-sm font-medium text-neutral-700"
            >
              Date
            </label>
            <input
              id="session-date"
              type="text"
              disabled
              placeholder="Date and time"
              className="mt-2 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              disabled
              className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600"
            >
              Save session
            </button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
