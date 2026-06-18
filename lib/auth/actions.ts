"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/auth/login";
import { getSafeInternalPath, isSafeInternalPath } from "@/lib/auth/redirects";
import { getRoleHomePath } from "@/lib/auth/roles";
import { setSessionCookie } from "@/lib/auth/session";

function getClientIp(headerValue: string | null) {
  return headerValue?.split(",")[0]?.trim() || null;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const headerStore = await headers();

  const result = await loginWithPassword({
    email,
    password,
    userAgent: headerStore.get("user-agent"),
    ipAddress: getClientIp(
      headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip"),
    ),
  });

  if (!result.ok) {
    const searchParams = new URLSearchParams({
      error: "invalid",
    });

    if (isSafeInternalPath(next)) {
      searchParams.set("next", next.trim());
    }

    redirect(`/login?${searchParams.toString()}`);
  }

  await setSessionCookie(result.token);
  redirect(getSafeInternalPath(next, getRoleHomePath(result.role)));
}
