import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminSessionCreateOptionsData } from "@/lib/admin/queries";
import { AdminCreateSessionForm } from "@/app/(admin)/admin/sessions/new/AdminCreateSessionForm";

export default async function AdminCreateSessionPage() {
  const authContext = await requireAdminAuthContext();
  const options = await getAdminSessionCreateOptionsData(authContext);

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Create Session"
        description="Prepare a new attendance session with real organization-scoped courses, sections, rooms, and instructors."
      >
        <ButtonLink
          href={routes.admin.sessions}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Back
        </ButtonLink>
        <StatusBadge label="Server action" tone="info" />
      </PageHeader>

      <AdminCreateSessionForm options={options} />
    </>
  );
}
