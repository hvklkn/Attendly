import type { InstructorAuthContext } from "@/lib/instructor/auth";

type AssignedSectionScopeOptions = {
  activeSectionOnly?: boolean;
  activeCourseOnly?: boolean;
};

export function getInstructorAssignedSectionWhere(
  authContext: InstructorAuthContext,
  options: AssignedSectionScopeOptions = {},
) {
  const organizationId = authContext.activeOrganization.id;

  return {
    organizationId,
    ...(options.activeSectionOnly ? { isActive: true } : {}),
    ...(options.activeCourseOnly
      ? {
          course: {
            is: {
              isActive: true,
            },
          },
        }
      : {}),
    instructorAssignments: {
      some: {
        organizationId,
        instructorMembershipId: authContext.membership.id,
        isActive: true,
      },
    },
  };
}

export function getInstructorAssignedSessionWhere(
  authContext: InstructorAuthContext,
  sessionId?: string,
) {
  return {
    ...(sessionId ? { id: sessionId } : {}),
    organizationId: authContext.activeOrganization.id,
    section: {
      is: getInstructorAssignedSectionWhere(authContext),
    },
  };
}
