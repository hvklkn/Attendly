import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import type {
  AdminRoomCreateFormErrors,
  ValidAdminRoomCreateInput,
} from "@/lib/admin/room-create";

export type CreateAdminRoomResult =
  | {
      ok: true;
      roomId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: AdminRoomCreateFormErrors;
    };

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createAdminRoom(
  authContext: AdminAuthContext,
  input: ValidAdminRoomCreateInput,
): Promise<CreateAdminRoomResult> {
  const organizationId = getAdminOrganizationId(authContext);

  try {
    const room = await db.$transaction(async (tx) => {
      const createdRoom = await tx.room.create({
        data: {
          organizationId,
          name: input.name,
          code: input.code,
          description: input.description,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          allowedRadiusMeters: input.allowedRadiusMeters,
          isActive: input.isActive,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: "room.created",
          targetType: "Room",
          targetId: createdRoom.id,
          metadata: {
            code: input.code,
            isActive: input.isActive,
            hasCoordinates: input.latitude !== null && input.longitude !== null,
          },
        },
      });

      return createdRoom;
    });

    return {
      ok: true,
      roomId: room.id,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Bu oda kodu kurumunuzda zaten kullanılıyor.",
        errors: {
          code: "Bu oda kodu kurumunuzda zaten kullanılıyor.",
        },
      };
    }

    return {
      ok: false,
      message: "Oda şu anda oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}
