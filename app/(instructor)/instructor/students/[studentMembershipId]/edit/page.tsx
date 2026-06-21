import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import {
  getInstructorOrganizationId,
  requireInstructorAuthContext,
} from "@/lib/instructor/auth";
import { getInstructorAssignedSectionWhere } from "@/lib/instructor/assignment-scope";
import { db } from "@/lib/db";
import { InstructorEditStudentForm } from "./InstructorEditStudentForm";

type InstructorStudentEditPageProps = {
  params: Promise<{
    studentMembershipId: string;
  }>;
};

export default async function InstructorStudentEditPage({
  params,
}: InstructorStudentEditPageProps) {
  const [{ studentMembershipId }, authContext] = await Promise.all([
    params,
    requireInstructorAuthContext(),
  ]);
  const studentMembership = await db.membership.findFirst({
    where: {
      id: studentMembershipId,
      organizationId: getInstructorOrganizationId(authContext),
      role: "STUDENT",
      enrollments: {
        some: {
          organizationId: getInstructorOrganizationId(authContext),
          section: {
            is: getInstructorAssignedSectionWhere(authContext),
          },
        },
      },
    },
    select: {
      id: true,
      studentNo: true,
      user: {
        select: {
          name: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!studentMembership) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Öğrenci Düzenle"
        description="Öğrenci adını ve öğrenci numarasını güncelleyin."
      >
        <ButtonLink
          href={routes.instructor.students}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Öğrencilere Dön
        </ButtonLink>
        <StatusBadge
          label={studentMembership.user.status === "ACTIVE" ? "Aktif" : "Pasif"}
          tone={
            studentMembership.user.status === "ACTIVE" ? "success" : "neutral"
          }
        />
      </PageHeader>

      <InstructorEditStudentForm
        studentMembershipId={studentMembership.id}
        email={studentMembership.user.email}
        initialValues={{
          name: studentMembership.user.name ?? "",
          studentNo: studentMembership.studentNo ?? "",
        }}
      />
    </>
  );
}
