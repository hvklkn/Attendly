"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Info,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { createAdminManagedUserAction } from "@/lib/admin/user-actions";
import {
  initialAdminCreateUserActionState,
  type AdminCreatableUserRole,
  type AdminCreateUserActionState,
  type AdminCreateUserFormErrors,
  type AdminCreateUserFormField,
  type AdminUserCreateOptionsData,
} from "@/lib/admin/user-create";
import { getRoleLabel } from "@/lib/localization";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const creatableRoles: AdminCreatableUserRole[] = [
  "ORG_ADMIN",
  "INSTRUCTOR",
  "STUDENT",
];

function getInitialState(
  initialRole: AdminCreatableUserRole,
): AdminCreateUserActionState {
  return {
    ...initialAdminCreateUserActionState,
    values: {
      ...initialAdminCreateUserActionState.values,
      role: initialRole,
    },
  };
}

function getFieldError(
  errors: AdminCreateUserFormErrors,
  field: AdminCreateUserFormField,
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
      {pending ? "Kaydediliyor..." : "Kaydet"}
    </button>
  );
}

export function AdminCreateUserForm({
  initialRole,
  options,
}: {
  initialRole: AdminCreatableUserRole;
  options: AdminUserCreateOptionsData;
}) {
  const [state, formAction] = useActionState(
    createAdminManagedUserAction,
    getInitialState(initialRole),
  );
  const { values, errors } = state;
  const [selectedRole, setSelectedRole] = useState(values.role);
  const isStudentRole = selectedRole === "STUDENT";

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={formAction} className="grid gap-6">
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
          description="Hesap bilgileri ve kurum üyeliği aynı sunucu işleminde oluşturulur."
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
                autoComplete="name"
                placeholder="Ayşe Yılmaz"
                defaultValue={values.name}
                aria-invalid={Boolean(getFieldError(errors, "name"))}
                aria-describedby={
                  getFieldError(errors, "name") ? "name-error" : undefined
                }
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
                autoComplete="email"
                placeholder="ayse@example.com"
                defaultValue={values.email}
                aria-invalid={Boolean(getFieldError(errors, "email"))}
                aria-describedby={
                  getFieldError(errors, "email") ? "email-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="role"
              label="Rol"
              description="Sistem yöneticisi rolü bu ekrandan oluşturulamaz."
              error={getFieldError(errors, "role")}
            >
              <select
                id="role"
                name="role"
                required
                value={selectedRole}
                onChange={(event) => {
                  setSelectedRole(event.target.value);
                }}
                aria-invalid={Boolean(getFieldError(errors, "role"))}
                aria-describedby={
                  getFieldError(errors, "role") ? "role-error" : undefined
                }
                className={selectClassName}
              >
                {creatableRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="password"
              label="Şifre"
              description="Geçici şifreyi güvenli bir kanaldan kullanıcıyla paylaşın."
              error={getFieldError(errors, "password")}
            >
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="En az 8 karakter"
                defaultValue={values.password}
                aria-invalid={Boolean(getFieldError(errors, "password"))}
                aria-describedby={
                  getFieldError(errors, "password")
                    ? "password-error"
                    : undefined
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </SectionCard>

        {isStudentRole ? (
          <SectionCard
            title="Ders Grubu Kayıtları"
            description="Öğrenciyi bir veya daha fazla ders grubuna isteğe bağlı olarak kaydedin."
          >
            {options.sections.length > 0 ? (
              <div className="grid gap-3">
                {options.sections.map((section) => {
                  const sectionName = section.code
                    ? `${section.code} · ${section.name}`
                    : section.name;
                  const instructor = section.instructorMembership?.user
                    ? section.instructorMembership.user.name
                      ? `${section.instructorMembership.user.name} · ${section.instructorMembership.user.email}`
                      : section.instructorMembership.user.email
                    : "Öğretmen henüz atanmadı";

                  return (
                    <label
                      key={section.id}
                      className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <input
                        name="sectionIds"
                        type="checkbox"
                        value={section.id}
                        defaultChecked={values.sectionIds.includes(section.id)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-900">
                          {section.course.code} · {sectionName}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-neutral-600">
                          Atanmış Öğretmen: {instructor}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-500">
                          {section._count.enrollments} kayıtlı öğrenci
                        </span>
                      </span>
                    </label>
                  );
                })}
                {getFieldError(errors, "sectionIds") ? (
                  <p className="text-sm text-rose-700">
                    {getFieldError(errors, "sectionIds")}
                  </p>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="Ders grubu bulunamadı"
                description="Öğrenci hesabı yine oluşturulabilir; ders grubu kaydı daha sonra eklenebilir."
                icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            )}
          </SectionCard>
        ) : null}

        <SectionCard
          title="Durum"
          description="Aktif kullanıcılar hemen giriş yapabilir; pasif bırakılanlar davet bekler durumda tutulur."
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
                Aktif durum
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                İşaretliyse kullanıcı hesabı aktif oluşturulur.
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
              E-posta benzersizliği ve kurum üyeliği sunucuda doğrulanır.
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
          title="Rol Kapsamı"
          description="Kurum yöneticileri bu ekrandan yönetici, öğretmen ve öğrenci oluşturabilir."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Kurum Yöneticisi
              </span>
              <StatusBadge label="Oluşturulabilir" tone="success" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Öğretmen
              </span>
              <StatusBadge label="Oluşturulabilir" tone="success" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Öğrenci
              </span>
              <StatusBadge label="Oluşturulabilir" tone="success" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Güvenlik Notları">
          <div className="space-y-4 text-sm leading-6 text-neutral-600">
            <div className="flex gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>E-posta adresi sistem genelinde benzersiz olmalıdır.</p>
            </div>
            <div className="flex gap-3">
              <KeyRound className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>Şifre yalnızca hash olarak saklanır; ham şifre gösterilmez.</p>
            </div>
            <div className="flex gap-3">
              <Info className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>
                CSV ile toplu öğrenci aktarımı sonraki adımda aynı doğrulama
                kurallarını kullanacak.
              </p>
            </div>
          </div>
        </SectionCard>
      </aside>
    </section>
  );
}
