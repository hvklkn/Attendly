import "server-only";

import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";
import { getAdminOrganizationId, type AdminAuthContext } from "@/lib/admin/auth";
import { canIssueQrTokenForSessionStatus } from "@/lib/admin/session-qr";
import { db } from "@/lib/db";
import {
  createQrScanUrl,
  createRawQrToken,
  getQrTokenExpiresAt,
  hashQrToken,
} from "@/lib/qr-tokens";
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

export type IssueAdminSessionQrTokenResult =
  | {
      ok: true;
      attendanceSessionId: string;
      tokenId: string;
      rawToken: string;
      scanUrl: string;
      expiresAt: Date;
      createdAt: Date;
      revokedPreviousCount: number;
    }
  | {
      ok: false;
      message: string;
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

export async function issueAdminSessionQrToken(
  authContext: AdminAuthContext,
  sessionId: string,
): Promise<IssueAdminSessionQrTokenResult> {
  const organizationId = getAdminOrganizationId(authContext);
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    return {
      ok: false,
      message: "Select a valid attendance session before issuing a QR token.",
    };
  }

  try {
    const attendanceSession = await db.attendanceSession.findFirst({
      where: {
        id: normalizedSessionId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!attendanceSession) {
      return {
        ok: false,
        message: "Attendance session was not found.",
      };
    }

    if (!canIssueQrTokenForSessionStatus(attendanceSession.status)) {
      return {
        ok: false,
        message:
          "QR tokens can only be issued for draft, scheduled, or active sessions.",
      };
    }

    const rawToken = createRawQrToken();
    const tokenHash = hashQrToken(rawToken);
    const createdAt = new Date();
    const expiresAt = getQrTokenExpiresAt(createdAt);

    const [revokedPreviousTokens, qrToken] = await db.$transaction([
      db.qRToken.updateMany({
        where: {
          organizationId,
          attendanceSessionId: attendanceSession.id,
          revokedAt: null,
          expiresAt: {
            gt: createdAt,
          },
        },
        data: {
          revokedAt: createdAt,
        },
      }),
      db.qRToken.create({
        data: {
          organizationId,
          attendanceSessionId: attendanceSession.id,
          createdByMembershipId: authContext.membership.id,
          tokenHash,
          expiresAt,
          createdAt,
        },
        select: {
          id: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      ok: true,
      attendanceSessionId: attendanceSession.id,
      tokenId: qrToken.id,
      rawToken,
      scanUrl: createQrScanUrl(rawToken),
      expiresAt: qrToken.expiresAt,
      createdAt: qrToken.createdAt,
      revokedPreviousCount: revokedPreviousTokens.count,
    };
  } catch {
    return {
      ok: false,
      message:
        "We could not issue a QR token right now. Please try again in a moment.",
    };
  }
}
