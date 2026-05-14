import "server-only";

import {
  MembershipRole,
  OrganizationStatus,
  UserStatus,
} from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
} from "@/lib/auth/session";
import {
  initialRegisterFormValues,
  organizationTypeOptions,
  type OrganizationType,
  type RegisterFormErrors,
  type RegisterFormValues,
} from "@/lib/onboarding/register-shared";

const PASSWORD_MIN_LENGTH = 8;
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 48;

export type ValidRegisterInput = {
  organizationName: string;
  organizationType: OrganizationType;
  city: string | null;
  slug: string;
  adminName: string;
  email: string;
  password: string;
};

export type RegisterOrganizationAdminResult =
  | {
      ok: true;
      sessionToken: string;
      organizationId: string;
      userId: string;
      membershipId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: RegisterFormErrors;
    };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function slugify(value: string) {
  const normalizedValue = value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalizedValue
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isOrganizationType(value: string): value is OrganizationType {
  return organizationTypeOptions.some((option) => option.value === value);
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSlugValid(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function getRegisterFormValues(formData: FormData): RegisterFormValues {
  return {
    organizationName: String(
      formData.get("organizationName") ??
        initialRegisterFormValues.organizationName,
    ),
    organizationType: String(
      formData.get("organizationType") ??
        initialRegisterFormValues.organizationType,
    ),
    city: String(formData.get("city") ?? initialRegisterFormValues.city),
    slug: String(formData.get("slug") ?? initialRegisterFormValues.slug),
    adminName: String(
      formData.get("adminName") ?? initialRegisterFormValues.adminName,
    ),
    email: String(formData.get("email") ?? initialRegisterFormValues.email),
    password: String(
      formData.get("password") ?? initialRegisterFormValues.password,
    ),
    passwordConfirm: String(
      formData.get("passwordConfirm") ??
        initialRegisterFormValues.passwordConfirm,
    ),
  };
}

export function validateRegisterFormValues(values: RegisterFormValues):
  | {
      ok: true;
      data: ValidRegisterInput;
      values: RegisterFormValues;
    }
  | {
      ok: false;
      values: RegisterFormValues;
      errors: RegisterFormErrors;
    } {
  const organizationName = normalizeText(values.organizationName);
  const organizationType = values.organizationType.trim();
  const city = normalizeText(values.city);
  const adminName = normalizeText(values.adminName);
  const email = values.email.trim().toLowerCase();
  const providedSlug = values.slug.trim();
  const slug = slugify(providedSlug || organizationName);
  const password = values.password;
  const passwordConfirm = values.passwordConfirm;

  const normalizedValues: RegisterFormValues = {
    organizationName,
    organizationType,
    city,
    slug,
    adminName,
    email,
    password,
    passwordConfirm,
  };
  const errors: RegisterFormErrors = {};

  if (!organizationName) {
    errors.organizationName = "Kurum adı zorunludur.";
  }

  if (!isOrganizationType(organizationType)) {
    errors.organizationType = "Kurum tipi seçin.";
  }

  if (!slug) {
    errors.slug = "Kurum kısa adı oluşturulamadı.";
  } else if (
    slug.length < SLUG_MIN_LENGTH ||
    slug.length > SLUG_MAX_LENGTH ||
    !isSlugValid(slug)
  ) {
    errors.slug =
      "Kurum kısa adı 3-48 karakter olmalı; yalnızca küçük harf, rakam ve tire içermelidir.";
  }

  if (!adminName) {
    errors.adminName = "Ad soyad zorunludur.";
  }

  if (!email) {
    errors.email = "E-posta zorunludur.";
  } else if (!isEmailValid(email)) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;
  }

  if (passwordConfirm !== password) {
    errors.passwordConfirm = "Şifreler eşleşmiyor.";
  }

  if (Object.keys(errors).length > 0 || !isOrganizationType(organizationType)) {
    return {
      ok: false,
      values: normalizedValues,
      errors,
    };
  }

  return {
    ok: true,
    values: normalizedValues,
    data: {
      organizationName,
      organizationType,
      city: city || null,
      slug,
      adminName,
      email,
      password,
    },
  };
}

export async function registerOrganizationAdmin(input: {
  data: ValidRegisterInput;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<RegisterOrganizationAdminResult> {
  const emailExists = await db.user.findUnique({
    where: {
      email: input.data.email,
    },
    select: {
      id: true,
    },
  });

  if (emailExists) {
    return {
      ok: false,
      message: "Bu e-posta adresi zaten kullanılıyor.",
      errors: {
        email: "Bu e-posta adresi zaten kullanılıyor.",
      },
    };
  }

  const slugExists = await db.organization.findUnique({
    where: {
      slug: input.data.slug,
    },
    select: {
      id: true,
    },
  });

  if (slugExists) {
    return {
      ok: false,
      message: "Bu kurum kısa adı zaten kullanılıyor.",
      errors: {
        slug: "Bu kurum kısa adı zaten kullanılıyor.",
      },
    };
  }

  const passwordHash = await hashPassword(input.data.password);
  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const sessionExpiresAt = getSessionExpiresAt();

  try {
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.data.organizationName,
          slug: input.data.slug,
          status: OrganizationStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.data.email,
          name: input.data.adminName,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MembershipRole.ORG_ADMIN,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorUserId: user.id,
          action: "ORGANIZATION_REGISTERED",
          targetType: "Organization",
          targetId: organization.id,
          metadata: {
            organizationType: input.data.organizationType,
            city: input.data.city,
            source: "public_register",
          },
        },
      });

      await tx.deviceSession.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          sessionTokenHash,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          expiresAt: sessionExpiresAt,
        },
      });

      return {
        organizationId: organization.id,
        userId: user.id,
        membershipId: membership.id,
      };
    });

    return {
      ok: true,
      sessionToken,
      ...result,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message:
          "Bu e-posta veya kurum kısa adı zaten kullanılıyor. Lütfen bilgileri kontrol edin.",
      };
    }

    return {
      ok: false,
      message: "Kayıt şu anda tamamlanamadı. Lütfen tekrar deneyin.",
    };
  }
}

