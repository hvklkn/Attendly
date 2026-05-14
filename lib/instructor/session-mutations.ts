import "server-only";

import {
  getInstructorOrganizationId,
  type InstructorAuthContext,
} from "@/lib/instructor/auth";
import {
  issueAttendanceSessionQrToken,
  type IssueAttendanceSessionQrTokenResult,
} from "@/lib/qr-issuance";

export type IssueInstructorSessionQrTokenResult =
  IssueAttendanceSessionQrTokenResult;

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
