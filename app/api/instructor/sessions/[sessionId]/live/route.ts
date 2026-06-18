import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth/context";
import {
  canAccessInstructorLiveSession,
  getInstructorSessionLiveData,
} from "@/lib/instructor/session-live";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!canAccessInstructorLiveSession(authContext)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sessionId } = await context.params;
  const data = await getInstructorSessionLiveData(authContext, sessionId);

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
