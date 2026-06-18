import { routes } from "@/constants/routes";

export type StudentScanResultCode =
  | "missing_token"
  | "success"
  | "late_success"
  | "already_checked_in"
  | "outside_geofence"
  | "expired_token"
  | "revoked_token"
  | "invalid_token"
  | "session_closed"
  | "session_unavailable"
  | "location_unavailable"
  | "error";

export function createStudentScanResultUrl(input: {
  code: StudentScanResultCode;
  recordId?: string | null;
  sessionId?: string | null;
  token?: string | null;
}) {
  const searchParams = new URLSearchParams({
    code: input.code,
  });

  if (input.recordId) {
    searchParams.set("recordId", input.recordId);
  }

  if (input.sessionId) {
    searchParams.set("sessionId", input.sessionId);
  }

  if (input.token) {
    searchParams.set("token", input.token);
  }

  return `${routes.student.scanResult}?${searchParams.toString()}`;
}
