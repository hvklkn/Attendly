import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

function deriveKey(password: string, salt: string, options: {
  N: number;
  r: number;
  p: number;
}) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      {
        ...options,
        maxmem: SCRYPT_MAXMEM,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await deriveKey(password, salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt,
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, n, r, p, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !hash) {
    return false;
  }

  try {
    const derivedKey = await deriveKey(password, salt, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    const storedKey = Buffer.from(hash, "base64url");

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  } catch {
    return false;
  }
}
