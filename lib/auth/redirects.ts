import { routes } from "@/constants/routes";

export function isSafeInternalPath(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const trimmedValue = value.trim();

  return (
    trimmedValue.startsWith("/") &&
    !trimmedValue.startsWith("//") &&
    !trimmedValue.startsWith("/\\") &&
    !/^https?:\/\//i.test(trimmedValue)
  );
}

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmedValue = value?.trim();

  return trimmedValue && isSafeInternalPath(trimmedValue)
    ? trimmedValue
    : fallback;
}

export function createLoginPathWithNext(nextPath: string | null | undefined) {
  const trimmedNextPath = nextPath?.trim();

  if (!trimmedNextPath || !isSafeInternalPath(trimmedNextPath)) {
    return routes.public.login;
  }

  const searchParams = new URLSearchParams({
    next: trimmedNextPath,
  });

  return `${routes.public.login}?${searchParams.toString()}`;
}
