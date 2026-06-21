"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
import {
  assignTemporaryPassword,
  requestPasswordReset,
} from "@/lib/auth/password-management";
import { db } from "@/lib/db";

export type AdminPasswordSupportActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAdminPasswordSupportActionState: AdminPasswordSupportActionState =
  {
    status: "idle",
    message: null,
  };

async function getScopedMembership(input: {
  membershipId: string;
  organizationId: string;
}) {
  return db.membership.findFirst({
    where: {
      id: input.membershipId.trim(),
      organizationId: input.organizationId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });
}

export async function adminSendPasswordResetAction(
  _previousState: AdminPasswordSupportActionState,
  formData: FormData,
): Promise<AdminPasswordSupportActionState> {
  const authContext = await requireAdminAuthContext();
  const organizationId = getAdminOrganizationId(authContext);
  const membership = await getScopedMembership({
    membershipId: String(formData.get("membershipId") ?? ""),
    organizationId,
  });

  if (!membership) {
    return {
      status: "error",
      message: "Kullanıcı bulunamadı.",
    };
  }

  const result = await requestPasswordReset({
    email: membership.user.email,
    actorUserId: authContext.user.id,
    auditAction: "PASSWORD_RESET_BY_ADMIN",
  });

  revalidatePath(routes.admin.users);
  revalidatePath(`${routes.admin.users}/${membership.id}/edit`);

  return {
    status: result.ok ? "success" : "error",
    message: result.ok
      ? "Şifre sıfırlama bağlantısı gönderim süreci başlatıldı."
      : result.message,
  };
}

export async function adminAssignTemporaryPasswordAction(
  _previousState: AdminPasswordSupportActionState,
  formData: FormData,
): Promise<AdminPasswordSupportActionState> {
  const authContext = await requireAdminAuthContext();
  const organizationId = getAdminOrganizationId(authContext);
  const membershipId = String(formData.get("membershipId") ?? "");
  const result = await assignTemporaryPassword({
    organizationId,
    actorUserId: authContext.user.id,
    targetMembershipId: membershipId,
    temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
    temporaryPasswordConfirm: String(
      formData.get("temporaryPasswordConfirm") ?? "",
    ),
  });

  revalidatePath(routes.admin.users);
  revalidatePath(`${routes.admin.users}/${membershipId}/edit`);

  return {
    status: result.ok ? "success" : "error",
    message: result.message,
  };
}
