import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
  authCookieBaseOptions,
} from "@/constants/auth";
import { db } from "@/lib/db";
import type { AuthDeviceSession } from "@/types/auth";

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiresAt() {
  return new Date(Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000);
}

export async function getSessionCookieValue() {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, token, {
    ...authCookieBaseOptions,
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, "", {
    ...authCookieBaseOptions,
    maxAge: 0,
  });
}

export async function createDeviceSession(input: {
  userId: string;
  organizationId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt();

  const deviceSession = await db.deviceSession.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      sessionTokenHash: tokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt,
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });

  return {
    token,
    expiresAt,
    deviceSession,
  };
}

export async function getCurrentSessionFromCookie(): Promise<AuthDeviceSession | null> {
  const token = await getSessionCookieValue();

  if (!token) {
    return null;
  }

  return db.deviceSession.findFirst({
    where: {
      sessionTokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });
}

export async function revokeSessionToken(token: string) {
  await db.deviceSession.updateMany({
    where: {
      sessionTokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
