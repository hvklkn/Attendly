import { routes } from "@/constants/routes";
import type { MembershipRole } from "@/lib/generated/prisma/enums";

export function getRoleHomePath(role: MembershipRole) {
  switch (role) {
    case "SUPER_ADMIN":
    case "ORG_ADMIN":
      return routes.admin.dashboard;
    case "INSTRUCTOR":
      return routes.instructor.dashboard;
    case "STUDENT":
      return routes.student.scan;
  }
}

export function hasAnyRole(role: MembershipRole, roles: MembershipRole[]) {
  return roles.includes(role);
}
