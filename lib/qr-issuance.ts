import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { canIssueQrTokenForSessionStatus } from "@/lib/qr-ui";
import {
  createQrScanUrl,
  createRawQrToken,
  getQrTokenExpiresAt,
  hashQrToken,
} from "@/lib/qr-tokens";
import type { AuthContext } from "@/types/auth";

export type IssueAttendanceSessionQrTokenResult =
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

type IssueAttendanceSessionQrTokenInput = {
  sessionId: string;
  organizationId: string;
  instructorMembershipId?: string;
};

async function getRequestOrigin() {
  try {
    const requestHeaders = await headers();
    const directOrigin = requestHeaders.get("origin");

    if (directOrigin) {
      return directOrigin;
    }

    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      return undefined;
    }

    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

    return `${protocol}://${host}`;
  } catch {
    return undefined;
  }
}

export async function issueAttendanceSessionQrToken(
  authContext: AuthContext,
  input: IssueAttendanceSessionQrTokenInput,
): Promise<IssueAttendanceSessionQrTokenResult> {
  const normalizedSessionId = input.sessionId.trim();

  if (input.organizationId !== authContext.activeOrganization.id) {
    return {
      ok: false,
      message: "Yoklama oturumu bulunamadı.",
    };
  }

  if (!normalizedSessionId) {
    return {
      ok: false,
      message: "QR oluşturmak için geçerli bir yoklama oturumu seçin.",
    };
  }

  try {
    const attendanceSession = await db.attendanceSession.findFirst({
      where: {
        id: normalizedSessionId,
        organizationId: input.organizationId,
        ...(input.instructorMembershipId
          ? {
              section: {
                is: {
                  instructorMembershipId: input.instructorMembershipId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!attendanceSession) {
      return {
        ok: false,
        message: "Yoklama oturumu bulunamadı.",
      };
    }

    if (!canIssueQrTokenForSessionStatus(attendanceSession.status)) {
      return {
        ok: false,
        message:
          "QR kodu yalnızca taslak, planlı veya aktif oturumlar için oluşturulabilir.",
      };
    }

    const rawToken = createRawQrToken();
    const tokenHash = hashQrToken(rawToken);
    const createdAt = new Date();
    const expiresAt = getQrTokenExpiresAt(createdAt);

    const [revokedPreviousTokens, qrToken] = await db.$transaction([
      db.qRToken.updateMany({
        where: {
          organizationId: input.organizationId,
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
          organizationId: input.organizationId,
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
      scanUrl: createQrScanUrl(rawToken, await getRequestOrigin()),
      expiresAt: qrToken.expiresAt,
      createdAt: qrToken.createdAt,
      revokedPreviousCount: revokedPreviousTokens.count,
    };
  } catch {
    return {
      ok: false,
      message: "QR kodu şu anda oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}
