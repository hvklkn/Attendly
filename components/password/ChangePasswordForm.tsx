"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { PasswordField } from "@/components/password/PasswordField";
import {
  changeOwnPasswordAction,
  initialChangePasswordActionState,
} from "@/lib/auth/password-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
    </button>
  );
}

export function ChangePasswordForm({
  mustChangePassword = false,
}: {
  mustChangePassword?: boolean;
}) {
  const [state, formAction] = useActionState(
    changeOwnPasswordAction,
    initialChangePasswordActionState,
  );

  return (
    <SectionCard
      title="Şifre Değiştir"
      description={
        mustChangePassword
          ? "Devam etmeden önce geçici şifrenizi kalıcı bir şifreyle değiştirin."
          : "Hesap güvenliğiniz için mevcut şifrenizi doğrulayarak yeni şifre belirleyin."
      }
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      {mustChangePassword ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Güvenlik nedeniyle ilk girişte şifrenizi değiştirmeniz gerekiyor.
        </div>
      ) : null}
      {state.message ? (
        <div
          role="alert"
          className={
            state.status === "success"
              ? "mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              : "mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          }
        >
          {state.message}
        </div>
      ) : null}
      <form action={formAction} className="grid gap-5">
        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Mevcut şifre"
          autoComplete="current-password"
          placeholder="Mevcut şifreniz"
        />
        <div className="grid gap-5 md:grid-cols-2">
          <PasswordField
            id="new-password"
            name="newPassword"
            label="Yeni şifre"
            autoComplete="new-password"
            placeholder="En az 8 karakter"
          />
          <PasswordField
            id="new-password-confirm"
            name="newPasswordConfirm"
            label="Yeni şifre tekrar"
            autoComplete="new-password"
            placeholder="Yeni şifreyi tekrar girin"
          />
        </div>
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </SectionCard>
  );
}
