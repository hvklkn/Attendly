import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { routes } from "@/constants/routes";

export const QR_TOKEN_RANDOM_BYTES = 32;
export const QR_TOKEN_TTL_SECONDS = 60;

export function createRawQrToken() {
  return randomBytes(QR_TOKEN_RANDOM_BYTES).toString("base64url");
}

export function hashQrToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getQrTokenExpiresAt(
  issuedAt = new Date(),
  ttlSeconds = QR_TOKEN_TTL_SECONDS,
) {
  return new Date(issuedAt.getTime() + ttlSeconds * 1000);
}

function getConfiguredAppBaseUrl(fallbackOrigin?: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    fallbackOrigin?.trim() ||
    "http://localhost:3000"
  );
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function createQrScanUrl(token: string, fallbackOrigin?: string) {
  const searchParams = new URLSearchParams({
    token,
  });
  const relativeScanUrl = `${routes.student.scan}?${searchParams.toString()}`;

  return new URL(relativeScanUrl, normalizeBaseUrl(getConfiguredAppBaseUrl(fallbackOrigin))).toString();
}
