import { MembershipRole } from "@/lib/generated/prisma/enums";

export const SECTION_RESPONSIBLE_ROLES = [
  MembershipRole.INSTRUCTOR,
  MembershipRole.ORG_ADMIN,
] as const;

export function isSectionResponsibleRole(role: MembershipRole) {
  return SECTION_RESPONSIBLE_ROLES.some(
    (responsibleRole) => responsibleRole === role,
  );
}
