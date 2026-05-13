export const AUTH_SESSION_COOKIE_NAME = "attendly_session";

export const AUTH_SESSION_DURATION_DAYS = 7;

export const AUTH_SESSION_MAX_AGE_SECONDS =
  AUTH_SESSION_DURATION_DAYS * 24 * 60 * 60;

export const authCookieBaseOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
