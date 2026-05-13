import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Workspace for managing administrators, instructors, and students."
      />

      <SectionCard
        title="User directory"
        description="Prepared for future role-based access and tenant-aware membership management."
      >
        <EmptyState
          title="No users connected"
          description="User records will be introduced after authentication, tenant membership, and role modeling are added."
        />
      </SectionCard>
    </>
  );
}
