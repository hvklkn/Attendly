"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { PasswordField } from "@/components/password/PasswordField";
import {
  completePasswordResetAction,
  initialResetPasswordActionState,
} from "@/lib/auth/password-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Güncelleniyor..." : "Yeni Şifreyi Kaydet"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    completePasswordResetAction,
    initialResetPasswordActionState,
  );

  return (
    <SectionCard
      title="Yeni Şifre Belirle"
      description="Şifre sıfırlama bağlantınız doğrulandı. Yeni şifreniz en az 8 karakter olmalıdır."
    >
      {state.message ? (
        <div
          role="alert"
          className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {state.message}
        </div>
      ) : null}
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
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
        <SubmitButton />
      </form>
    </SectionCard>
  );
}
