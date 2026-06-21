"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  initialForgotPasswordActionState,
  requestPasswordResetAction,
} from "@/lib/auth/password-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı İste"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialForgotPasswordActionState,
  );

  return (
    <SectionCard
      title="Şifremi Unuttum"
      description="E-posta adresinizi girin. Hesap uygunsa şifre sıfırlama bağlantısı gönderilir."
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <Mail className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      {state.message ? (
        <div
          role="status"
          className="mb-5 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700"
        >
          {state.message}
        </div>
      ) : null}
      <form action={formAction} className="grid gap-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            placeholder="ad@example.com"
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
          />
        </div>
        <SubmitButton />
      </form>
    </SectionCard>
  );
}
