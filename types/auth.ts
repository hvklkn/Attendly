import type {
  DeviceSession,
  Membership,
  Organization,
  User,
} from "@/lib/generated/prisma/client";
import type { MembershipRole } from "@/lib/generated/prisma/enums";

export type AuthUser = Pick<User, "id" | "email" | "name" | "status">;

export type AuthOrganization = Pick<
  Organization,
  "id" | "name" | "slug" | "status"
>;

export type AuthMembership = Pick<
  Membership,
  "id" | "organizationId" | "userId" | "role"
>;

export type AuthDeviceSession = Pick<
  DeviceSession,
  "id" | "organizationId" | "userId" | "lastSeenAt" | "expiresAt"
>;

export type AuthContext = {
  user: AuthUser;
  activeOrganization: AuthOrganization;
  membership: AuthMembership;
  role: MembershipRole;
  deviceSession: AuthDeviceSession;
};
