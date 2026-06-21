import { routes } from "@/constants/routes";

export type StudentScanResultCode =
  | "missing_token"
  | "success"
  | "late_success"
  | "already_checked_in"
  | "multi_device_attempt"
  | "outside_geofence"
  | "low_accuracy_location"
  | "expired_token"
  | "revoked_token"
  | "invalid_token"
  | "suspicious_token_reuse"
  | "session_closed"
  | "session_not_active"
  | "student_not_enrolled"
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
