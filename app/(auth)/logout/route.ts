import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  authCookieBaseOptions,
} from "@/constants/auth";
import { routes } from "@/constants/routes";
import { revokeSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  const response = NextResponse.redirect(new URL(routes.public.login, request.url), {
    status: 303,
  });

  response.cookies.set(AUTH_SESSION_COOKIE_NAME, "", {
    ...authCookieBaseOptions,
    maxAge: 0,
  });

  return response;
}
