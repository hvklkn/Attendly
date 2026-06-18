import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE_NAME } from "@/constants/auth";
import { createLoginPathWithNext } from "@/lib/auth/redirects";

const CURRENT_PATH_HEADER = "x-attendly-current-path";

function getCurrentPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

export function middleware(request: NextRequest) {
  const currentPath = getCurrentPath(request);
  const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(
      new URL(createLoginPathWithNext(currentPath), request.url),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CURRENT_PATH_HEADER, currentPath);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/student/:path*"],
};
