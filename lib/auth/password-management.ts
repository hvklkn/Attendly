import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { UserStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RESET_TOKEN_MINUTES = 30;
export const PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES = 10;
export const PASSWORD_RESET_RATE_LIMIT_MAX = 3;

export type PasswordResetTokenStatus =
  | "missing"
  | "invalid"
  | "expired"
  | "revoked"
  | "used"
  | "valid";

const RESET_REQUEST_GENERIC_MESSAGE =
  "Bu e-posta adresi sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir.";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getResetExpiresAt() {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_MINUTES * 60_000);
}

function getAppOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

function createResetUrl(token: string) {
  const searchParams = new URLSearchParams({ token });

  return `${getAppOrigin()}/reset-password?${searchParams.toString()}`;
}

function validateNewPassword(input: {
  password: string;
  passwordConfirm: string;
}) {
  if (input.password.length < PASSWORD_MIN_LENGTH) {
    return `Yeni şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;
  }

  if (input.password !== input.passwordConfirm) {
    return "Yeni şifre ve tekrar alanı eşleşmiyor.";
  }

  return null;
}

async function revokeUserSessions(
  userId: string,
  options: {
    exceptDeviceSessionId?: string;
  } = {},
) {
  await db.deviceSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(options.exceptDeviceSessionId
        ? {
            id: {
              not: options.exceptDeviceSessionId,
            },
          }
        : {}),
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function changeOwnPassword(input: {
  userId: string;
  organizationId: string;
  actorUserId: string;
  currentDeviceSessionId: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}) {
  const passwordError = validateNewPassword({
    password: input.newPassword,
    passwordConfirm: input.newPasswordConfirm,
  });

  if (passwordError) {
    return {
      ok: false,
      message: passwordError,
    };
  }

  const user = await db.user.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      id: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
    return {
      ok: false,
      message: "Şifre değiştirilemedi. Lütfen tekrar giriş yapın.",
    };
  }

  const currentPasswordMatches = await verifyPassword(
    input.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordMatches) {
    return {
      ok: false,
      message: "Mevcut şifre hatalı.",
    };
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  await db.$transaction([
    db.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
      },
    }),
    db.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
    db.deviceSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        id: {
          not: input.currentDeviceSessionId,
        },
      },
      data: {
        revokedAt: new Date(),
      },
    }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "PASSWORD_CHANGED_BY_USER",
        targetType: "User",
        targetId: user.id,
      },
    }),
  ]);

  return {
    ok: true,
    message: "Şifreniz başarıyla güncellendi.",
  };
}

async function findActiveUserForReset(email: string) {
  return db.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    select: {
      id: true,
      email: true,
      status: true,
      memberships: {
        where: {
          organization: {
            status: "ACTIVE",
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          organizationId: true,
        },
      },
    },
  });
}

export async function requestPasswordReset(input: {
  email: string;
  actorUserId?: string | null;
  auditAction?: "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_BY_ADMIN";
}) {
  const email = normalizeEmail(input.email);
  const user = await findActiveUserForReset(email);

  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    user.memberships.length === 0
  ) {
    return {
      ok: true,
      message: RESET_REQUEST_GENERIC_MESSAGE,
      delivered: false,
    };
  }

  const organizationId = user.memberships[0].organizationId;
  const recentRequestCount = await db.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(
          Date.now() - PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES * 60_000,
        ),
      },
    },
  });

  if (recentRequestCount >= PASSWORD_RESET_RATE_LIMIT_MAX) {
    await db.auditLog.create({
      data: {
        organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.auditAction ?? "PASSWORD_RESET_REQUESTED",
        targetType: "User",
        targetId: user.id,
        metadata: {
          rateLimited: true,
        },
      },
    });

    return {
      ok: true,
      message: RESET_REQUEST_GENERIC_MESSAGE,
      delivered: false,
    };
  }

  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = getResetExpiresAt();

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
    db.passwordResetToken.create({
      data: {
        organizationId,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
      },
    }),
    db.auditLog.create({
      data: {
        organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.auditAction ?? "PASSWORD_RESET_REQUESTED",
        targetType: "User",
        targetId: user.id,
      },
    }),
  ]);

  const delivery = await sendPasswordResetEmail({
    email: user.email,
    resetUrl: createResetUrl(rawToken),
    expiresAt,
  });

  return {
    ok: true,
    message: RESET_REQUEST_GENERIC_MESSAGE,
    delivered: delivery.delivered,
  };
}

export async function getPasswordResetTokenStatus(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return {
      status: "missing" as PasswordResetTokenStatus,
      token: null,
    };
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: {
      tokenHash: hashPasswordResetToken(normalizedToken),
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      user: {
        select: {
          email: true,
          status: true,
        },
      },
    },
  });

  if (!resetToken) {
    return {
      status: "invalid" as PasswordResetTokenStatus,
      token: null,
    };
  }

  if (resetToken.revokedAt) {
    return {
      status: "revoked" as PasswordResetTokenStatus,
      token: resetToken,
    };
  }

  if (resetToken.usedAt) {
    return {
      status: "used" as PasswordResetTokenStatus,
      token: resetToken,
    };
  }

  if (
    resetToken.expiresAt.getTime() <= Date.now() ||
    resetToken.user.status !== UserStatus.ACTIVE
  ) {
    return {
      status: "expired" as PasswordResetTokenStatus,
      token: resetToken,
    };
  }

  return {
    status: "valid" as PasswordResetTokenStatus,
    token: resetToken,
  };
}

export async function completePasswordReset(input: {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
}) {
  const passwordError = validateNewPassword({
    password: input.newPassword,
    passwordConfirm: input.newPasswordConfirm,
  });

  if (passwordError) {
    return {
      ok: false,
      message: passwordError,
      status: null as PasswordResetTokenStatus | null,
    };
  }

  const tokenStatus = await getPasswordResetTokenStatus(input.token);

  if (tokenStatus.status !== "valid" || !tokenStatus.token) {
    return {
      ok: false,
      message: getPasswordResetStatusMessage(tokenStatus.status),
      status: tokenStatus.status,
    };
  }

  const passwordHash = await hashPassword(input.newPassword);
  const completedAt = new Date();

  await db.$transaction([
    db.user.update({
      where: {
        id: tokenStatus.token.userId,
      },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
      },
    }),
    db.passwordResetToken.update({
      where: {
        id: tokenStatus.token.id,
      },
      data: {
        usedAt: completedAt,
      },
      select: {
        id: true,
      },
    }),
    db.deviceSession.updateMany({
      where: {
        userId: tokenStatus.token.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: completedAt,
      },
    }),
    db.auditLog.create({
      data: {
        organizationId: tokenStatus.token.organizationId,
        actorUserId: null,
        action: "PASSWORD_RESET_COMPLETED",
        targetType: "User",
        targetId: tokenStatus.token.userId,
      },
    }),
  ]);

  return {
    ok: true,
    message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    status: "valid" as PasswordResetTokenStatus,
  };
}

export async function assignTemporaryPassword(input: {
  organizationId: string;
  actorUserId: string;
  targetMembershipId: string;
  temporaryPassword: string;
  temporaryPasswordConfirm: string;
}) {
  const passwordError = validateNewPassword({
    password: input.temporaryPassword,
    passwordConfirm: input.temporaryPasswordConfirm,
  });

  if (passwordError) {
    return {
      ok: false,
      message: passwordError,
    };
  }

  const membership = await db.membership.findFirst({
    where: {
      id: input.targetMembershipId,
      organizationId: input.organizationId,
    },
    select: {
      userId: true,
      user: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      ok: false,
      message: "Kullanıcı bulunamadı.",
    };
  }

  if (membership.user.status !== UserStatus.ACTIVE) {
    return {
      ok: false,
      message: "Pasif kullanıcı için geçici şifre atanamaz.",
    };
  }

  const passwordHash = await hashPassword(input.temporaryPassword);
  const now = new Date();

  await db.$transaction([
    db.user.update({
      where: {
        id: membership.userId,
      },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
      },
    }),
    db.passwordResetToken.updateMany({
      where: {
        userId: membership.userId,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    }),
    db.deviceSession.updateMany({
      where: {
        userId: membership.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "TEMPORARY_PASSWORD_ASSIGNED",
        targetType: "User",
        targetId: membership.userId,
      },
    }),
  ]);

  return {
    ok: true,
    message:
      "Geçici şifre atandı. Kullanıcı ilk girişte şifresini değiştirmeye yönlendirilecek.",
  };
}

export function getPasswordResetStatusMessage(status: PasswordResetTokenStatus) {
  if (status === "missing") {
    return "Şifre sıfırlama bağlantısı eksik.";
  }

  if (status === "expired") {
    return "Şifre sıfırlama bağlantısının süresi dolmuş.";
  }

  if (status === "revoked") {
    return "Bu şifre sıfırlama bağlantısı artık geçerli değil.";
  }

  if (status === "used") {
    return "Bu şifre sıfırlama bağlantısı daha önce kullanılmış.";
  }

  if (status === "invalid") {
    return "Şifre sıfırlama bağlantısı geçersiz.";
  }

  return "Şifre sıfırlama bağlantısı geçerli.";
}
