import { AttendanceSessionStatus } from "@/lib/generated/prisma/enums";

export const QR_ISSUABLE_SESSION_STATUSES = [
  AttendanceSessionStatus.DRAFT,
  AttendanceSessionStatus.SCHEDULED,
  AttendanceSessionStatus.ACTIVE,
] as const;

export type QrTokenStatus = "active" | "expired" | "revoked";

export type QrTokenMetadata = {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type IssuedQrToken = QrTokenMetadata & {
  rawToken: string;
  scanUrl: string;
  revokedPreviousCount: number;
};

export type IssueQrTokenActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  issuedToken: IssuedQrToken | null;
};

export const initialIssueQrTokenActionState: IssueQrTokenActionState = {
  status: "idle",
  message: null,
  issuedToken: null,
};

export function canIssueQrTokenForSessionStatus(status: string) {
  return QR_ISSUABLE_SESSION_STATUSES.some(
    (issuableStatus) => issuableStatus === status,
  );
}

export function getQrTokenStatus(
  token: Pick<QrTokenMetadata, "expiresAt" | "revokedAt">,
  now = new Date(),
): QrTokenStatus {
  if (token.revokedAt) {
    return "revoked";
  }

  return new Date(token.expiresAt).getTime() <= now.getTime()
    ? "expired"
    : "active";
}
