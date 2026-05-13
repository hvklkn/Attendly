import "server-only";

import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import type {
  CreateSessionFormErrors,
  ValidCreateSessionInput,
} from "@/lib/admin/session-create";

export type CreateAdminSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: CreateSessionFormErrors;
    };

export async function createAdminAttendanceSession(
  authContext: AdminAuthContext,
  input: ValidCreateSessionInput,
): Promise<CreateAdminSessionResult> {
  const organizationId = getAdminOrganizationId(authContext);

  try {
    const section = await db.section.findFirst({
      where: {
        id: input.sectionId,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!section) {
      return {
        ok: false,
        message: "Select an active section from this organization.",
        errors: {
          sectionId: "Select an active section from this organization.",
        },
      };
    }

    if (input.courseId && section.courseId !== input.courseId) {
      return {
        ok: false,
        message: "The selected course does not match the selected section.",
        errors: {
          courseId: "Choose the course that owns the selected section.",
          sectionId: "Choose a section for the selected course.",
        },
      };
    }

    let roomId: string | null = null;

    if (input.roomId) {
      const room = await db.room.findFirst({
        where: {
          id: input.roomId,
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!room) {
        return {
          ok: false,
          message:
            "Select an active room from this organization, or leave it empty.",
          errors: {
            roomId:
              "Select an active room from this organization, or leave it empty.",
          },
        };
      }

      roomId = room.id;
    }

    const session = await db.attendanceSession.create({
      data: {
        organizationId,
        sectionId: section.id,
        roomId,
        createdByMembershipId: authContext.membership.id,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        lateThresholdMinutes: input.lateThresholdMinutes,
        status: AttendanceSessionStatus.SCHEDULED,
      },
      select: {
        id: true,
      },
    });

    return {
      ok: true,
      sessionId: session.id,
    };
  } catch {
    return {
      ok: false,
      message:
        "We could not create the session right now. Please review the form and try again.",
    };
  }
}
