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

export function createQrScanUrl(token: string) {
  const searchParams = new URLSearchParams({
    token,
  });

  return `${routes.student.scan}?${searchParams.toString()}`;
}
