"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Mail, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { updateAdminManagedUserAction } from "@/lib/admin/user-actions";
import {
  initialAdminEditUserActionState,
  type AdminEditUserFormErrors,
  type AdminEditUserFormField,
  type AdminEditUserFormValues,
} from "@/lib/admin/user-create";
import { MembershipRole } from "@/lib/generated/prisma/enums";
import { getRoleLabel } from "@/lib/localization";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

function getFieldError(
  errors: AdminEditUserFormErrors,
  field: AdminEditUserFormField,
) {
  return errors[field];
}

function Field({
  id,
  label,
  children,
  description,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  description?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs leading-5 text-rose-700">
          {error}
        </p>
      ) : description ? (
        <p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Kaydediliyor..." : "Kullanıcıyı Güncelle"}
    </button>
  );
}

export function AdminEditUserForm({
  membershipId,
  role,
  initialValues,
}: {
  membershipId: string;
  role: MembershipRole;
  initialValues: AdminEditUserFormValues;
}) {
  const [state, formAction] = useActionState(updateAdminManagedUserAction, {
    ...initialAdminEditUserActionState,
    values: initialValues,
  });
  const { values, errors } = state;
  const isStudent = role === MembershipRole.STUDENT;

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={formAction} className="grid gap-6">
        <input type="hidden" name="membershipId" value={membershipId} />
        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.message}
          </div>
        ) : null}

        <SectionCard
          title="Kullanıcı Bilgileri"
          description="Ad soyad ve e-posta bilgileri kullanıcı hesabına aittir."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              id="name"
              label="Ad Soyad"
              error={getFieldError(errors, "name")}
            >
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={values.name}
                className={inputClassName}
              />
            </Field>

            <Field
              id="email"
              label="E-posta"
              error={getFieldError(errors, "email")}
            >
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={values.email}
                className={inputClassName}
              />
            </Field>

            <Field
              id="role"
              label="Rol"
              description="Rol değişikliği veri bütünlüğü için bu ekranda kapalıdır."
            >
              <input
                id="role"
                value={getRoleLabel(role)}
                readOnly
                className={inputClassName}
              />
            </Field>

            <Field
              id="studentNo"
              label="Öğrenci Numarası"
              description={
                isStudent
                  ? "İsteğe bağlı öğrenci numarası."
                  : "Yalnızca öğrenci rolünde düzenlenir."
              }
              error={getFieldError(errors, "studentNo")}
            >
              <input
                id="studentNo"
                name="studentNo"
                type="text"
                disabled={!isStudent}
                defaultValue={values.studentNo}
                className={inputClassName}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Durum"
          description="Pasifleştirilen kullanıcı sisteme giriş yapamaz."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <label className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={values.isActive === "on"}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-500"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                Aktif
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                İşaret kaldırılırsa kullanıcı pasif hale gelir ve giriş
                yapamaz.
              </span>
            </span>
          </label>
        </SectionCard>

        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-950">
              Kaydetmeye hazır
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Eski yoklama kayıtları korunur; kullanıcı silinmez.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.admin.users}>İptal</ButtonLink>
            <SubmitButton />
          </div>
        </div>
      </form>

      <aside className="grid gap-6 self-start">
        <SectionCard
          title="Soft Delete"
          description="Attendly hesapları hard delete yapmaz; pasifleştirme kullanılır."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-3 text-sm leading-6 text-neutral-600">
            <p>Pasifleştirilen kullanıcı sisteme giriş yapamaz.</p>
            <p>Öğrenci ve öğretmen geçmiş kayıtları raporlarda korunur.</p>
          </div>
          <div className="mt-4">
            <StatusBadge label={getRoleLabel(role)} tone="info" />
          </div>
        </SectionCard>
      </aside>
    </section>
  );
}
