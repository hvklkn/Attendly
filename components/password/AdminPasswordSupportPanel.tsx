"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Mail } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { PasswordField } from "@/components/password/PasswordField";
import {
  adminAssignTemporaryPasswordAction,
  adminSendPasswordResetAction,
  initialAdminPasswordSupportActionState,
} from "@/lib/admin/password-actions";

function ResetLinkButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
    >
      {pending ? "Başlatılıyor..." : "Sıfırlama Bağlantısı Üret"}
    </button>
  );
}

function TemporaryPasswordButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Atanıyor..." : "Geçici Şifre Ata"}
    </button>
  );
}

export function AdminPasswordSupportPanel({
  membershipId,
}: {
  membershipId: string;
}) {
  const [resetState, resetAction] = useActionState(
    adminSendPasswordResetAction,
    initialAdminPasswordSupportActionState,
  );
  const [temporaryState, temporaryAction] = useActionState(
    adminAssignTemporaryPasswordAction,
    initialAdminPasswordSupportActionState,
  );

  return (
    <SectionCard
      title="Şifre Desteği"
      description="Kullanıcıya şifre sıfırlama bağlantısı gönderebilir veya geçici şifre atayabilirsiniz. Mevcut şifre hiçbir zaman gösterilmez."
      actions={
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
      }
    >
      <div className="grid gap-6">
        <form
          action={resetAction}
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <input type="hidden" name="membershipId" value={membershipId} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Sıfırlama bağlantısı üret / gönder
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                E-posta altyapısı yapılandırıldıysa kullanıcıya reset bağlantısı
                gönderilir.
              </p>
            </div>
            <ResetLinkButton />
          </div>
          {resetState.message ? (
            <div
              role="status"
              className={
                resetState.status === "success"
                  ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                  : "mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              }
            >
              {resetState.message}
            </div>
          ) : null}
        </form>

        <form
          action={temporaryAction}
          className="grid gap-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <input type="hidden" name="membershipId" value={membershipId} />
          <div>
            <p className="text-sm font-medium text-neutral-950">
              Geçici yeni şifre ata
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Kullanıcı ilk girişte şifresini değiştirmeye yönlendirilir ve
              diğer aktif oturumları kapatılır.
            </p>
          </div>
          {temporaryState.message ? (
            <div
              role="status"
              className={
                temporaryState.status === "success"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                  : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              }
            >
              {temporaryState.message}
            </div>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            <PasswordField
              id="temporary-password"
              name="temporaryPassword"
              label="Geçici şifre"
              autoComplete="new-password"
              placeholder="En az 8 karakter"
            />
            <PasswordField
              id="temporary-password-confirm"
              name="temporaryPasswordConfirm"
              label="Geçici şifre tekrar"
              autoComplete="new-password"
              placeholder="Geçici şifreyi tekrar girin"
            />
          </div>
          <div className="flex justify-end">
            <TemporaryPasswordButton />
          </div>
        </form>
      </div>
    </SectionCard>
  );
}
