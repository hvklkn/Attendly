import "server-only";

import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  issueAttendanceSessionQrToken,
  type IssueAttendanceSessionQrTokenResult,
} from "@/lib/qr-issuance";

export type IssueInstructorSessionQrTokenResult =
  IssueAttendanceSessionQrTokenResult;

export type StartInstructorAttendanceSessionResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function issueInstructorSessionQrToken(
  authContext: InstructorAuthContext,
  sessionId: string,
): Promise<IssueInstructorSessionQrTokenResult> {
  return issueAttendanceSessionQrToken(authContext, {
    sessionId,
    organizationId: getInstructorOrganizationId(authContext),
    instructorMembershipId: authContext.membership.id,
  });
}

export async function startInstructorAttendanceSession(
  authContext: InstructorAuthContext,
  sessionId: string,
): Promise<StartInstructorAttendanceSessionResult> {
  const organizationId = getInstructorOrganizationId(authContext);
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    return {
      ok: false,
      message: "Başlatmak için geçerli bir yoklama oturumu seçin.",
    };
  }

  try {
    const session = await db.attendanceSession.findFirst({
      where: {
        id: normalizedSessionId,
        organizationId,
        section: {
          is: {
            instructorMembershipId: authContext.membership.id,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!session) {
      return {
        ok: false,
        message: "Yoklama oturumu bulunamadı.",
      };
    }

    if (session.status === AttendanceSessionStatus.ACTIVE) {
      return {
        ok: true,
        sessionId: session.id,
      };
    }

    if (
      session.status !== AttendanceSessionStatus.DRAFT &&
      session.status !== AttendanceSessionStatus.SCHEDULED
    ) {
      return {
        ok: false,
        message: "Bu oturum artık başlatılamaz.",
      };
    }

    await db.attendanceSession.update({
      where: {
        id_organizationId: {
          id: session.id,
          organizationId,
        },
      },
      data: {
        status: AttendanceSessionStatus.ACTIVE,
      },
    });

    return {
      ok: true,
      sessionId: session.id,
    };
  } catch {
    return {
      ok: false,
      message: "Oturum şu anda başlatılamadı. Lütfen tekrar deneyin.",
    };
  }
}
