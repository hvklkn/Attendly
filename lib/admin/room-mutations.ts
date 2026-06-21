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

export type UpdateAdminRoomResult = CreateAdminRoomResult;

export type SetAdminRoomActiveResult =
  | {
      ok: true;
      roomId: string;
    }
  | {
      ok: false;
      message: string;
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

export async function updateAdminRoom(
  authContext: AdminAuthContext,
  roomId: string,
  input: ValidAdminRoomCreateInput,
): Promise<UpdateAdminRoomResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedRoomId = roomId.trim();

  if (!normalizedRoomId) {
    return {
      ok: false,
      message: "Düzenlenecek oda seçilmelidir.",
    };
  }

  try {
    const room = await db.$transaction(async (tx) => {
      const existingRoom = await tx.room.findFirst({
        where: {
          id: normalizedRoomId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!existingRoom) {
        return null;
      }

      const updatedRoom = await tx.room.update({
        where: {
          id_organizationId: {
            id: existingRoom.id,
            organizationId,
          },
        },
        data: {
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
          action: "room.updated",
          targetType: "Room",
          targetId: updatedRoom.id,
          metadata: {
            isActive: input.isActive,
            hasCoordinates: input.latitude !== null && input.longitude !== null,
          },
        },
      });

      return updatedRoom;
    });

    if (!room) {
      return {
        ok: false,
        message: "Oda bulunamadı.",
      };
    }

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
      message: "Oda şu anda güncellenemedi. Lütfen tekrar deneyin.",
    };
  }
}

export async function setAdminRoomActive(
  authContext: AdminAuthContext,
  roomId: string,
  isActive: boolean,
): Promise<SetAdminRoomActiveResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedRoomId = roomId.trim();

  if (!normalizedRoomId) {
    return {
      ok: false,
      message: "Güncellenecek oda seçilmelidir.",
    };
  }

  try {
    const room = await db.$transaction(async (tx) => {
      const existingRoom = await tx.room.findFirst({
        where: {
          id: normalizedRoomId,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      if (!existingRoom) {
        return null;
      }

      const updatedRoom = await tx.room.update({
        where: {
          id_organizationId: {
            id: existingRoom.id,
            organizationId,
          },
        },
        data: {
          isActive,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId: authContext.user.id,
          action: isActive ? "room.reactivated" : "room.deactivated",
          targetType: "Room",
          targetId: updatedRoom.id,
        },
      });

      return updatedRoom;
    });

    if (!room) {
      return {
        ok: false,
        message: "Oda bulunamadı.",
      };
    }

    return {
      ok: true,
      roomId: room.id,
    };
  } catch {
    return {
      ok: false,
      message: "Oda durumu güncellenemedi.",
    };
  }
}
