"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { BookOpen, CheckCircle2, Info, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { createAdminSectionAction } from "@/lib/admin/section-actions";
import {
  initialAdminSectionCreateActionState,
  type AdminSectionCreateFormErrors,
  type AdminSectionCreateFormField,
  type AdminSectionCreateOptionsData,
} from "@/lib/admin/section-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

function getFieldError(
  errors: AdminSectionCreateFormErrors,
  field: AdminSectionCreateFormField,
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

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Oluşturuluyor..." : "Ders Grubu Oluştur"}
    </button>
  );
}

function formatPerson(user: { name: string | null; email: string }) {
  return user.name ? `${user.name} · ${user.email}` : user.email;
}

export function AdminCreateSectionForm({
  options,
}: {
  options: AdminSectionCreateOptionsData;
}) {
  const [state, formAction] = useActionState(
    createAdminSectionAction,
    initialAdminSectionCreateActionState,
  );
  const { values, errors } = state;
  const hasCourses = options.courses.length > 0;
  const hasInstructors = options.instructors.length > 0;
  const hasRequiredData = hasCourses && hasInstructors;

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

        {!hasRequiredData ? (
          <SectionCard
            title="Ön koşullar eksik"
            description="Ders grubu oluşturmak için aktif ders / kurs ve aktif öğretmen gerekir."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {!hasCourses ? (
                <EmptyState
                  title="Aktif ders yok"
                  description="Önce bu kurum için aktif bir ders veya kurs kaydı gerekir."
                  icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
                  className="min-h-40"
                />
              ) : null}
              {!hasInstructors ? (
                <EmptyState
                  title="Aktif öğretmen yok"
                  description="Önce kurum kullanıcılarından bir öğretmen oluşturun."
                  icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
                  className="min-h-40"
                />
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        <SectionCard
          title="Ders Grubu"
          description="Ders grubu, bir ders / kurs ve bir atanmış öğretmen ile oluşturulur."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              id="course-id"
              label="Ders / Kurs"
              error={getFieldError(errors, "courseId")}
            >
              <select
                id="course-id"
                name="courseId"
                required
                disabled={!hasCourses}
                defaultValue={values.courseId}
                aria-invalid={Boolean(getFieldError(errors, "courseId"))}
                aria-describedby={
                  getFieldError(errors, "courseId")
                    ? "course-id-error"
                    : undefined
                }
                className={selectClassName}
              >
                <option value="" disabled>
                  Ders / kurs seçin
                </option>
                {options.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="instructor-membership-id"
              label="Öğretmen"
              description="Oturumlar bu öğretmenin panelinde görünür."
              error={getFieldError(errors, "instructorMembershipId")}
            >
              <select
                id="instructor-membership-id"
                name="instructorMembershipId"
                required
                disabled={!hasInstructors}
                defaultValue={values.instructorMembershipId}
                aria-invalid={Boolean(
                  getFieldError(errors, "instructorMembershipId"),
                )}
                aria-describedby={
                  getFieldError(errors, "instructorMembershipId")
                    ? "instructor-membership-id-error"
                    : undefined
                }
                className={selectClassName}
              >
                <option value="" disabled>
                  Öğretmen seçin
                </option>
                {options.instructors.map((membership) => (
                  <option key={membership.id} value={membership.id}>
                    {formatPerson(membership.user)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="name"
              label="Ders Grubu Adı"
              error={getFieldError(errors, "name")}
            >
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="A Grubu"
                disabled={!hasRequiredData}
                defaultValue={values.name}
                aria-invalid={Boolean(getFieldError(errors, "name"))}
                aria-describedby={
                  getFieldError(errors, "name") ? "name-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="code"
              label="Kod"
              description="İsteğe bağlıdır; girilirse kurum içinde benzersiz olmalıdır."
              error={getFieldError(errors, "code")}
            >
              <input
                id="code"
                name="code"
                type="text"
                placeholder="BIL101-A"
                disabled={!hasRequiredData}
                defaultValue={values.code}
                aria-invalid={Boolean(getFieldError(errors, "code"))}
                aria-describedby={
                  getFieldError(errors, "code") ? "code-error" : undefined
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Durum"
          description="Pasif ders grupları yeni yoklama oturumu oluşturma listesinde kullanılmaz."
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
              disabled={!hasRequiredData}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-500 disabled:cursor-not-allowed"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                Aktif
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                İşaretliyse bu ders grubu için yoklama oturumu oluşturulabilir.
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
              Ders grubu yalnızca mevcut kurum içinde oluşturulur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.admin.sections}>İptal</ButtonLink>
            <SubmitButton disabled={!hasRequiredData} />
          </div>
        </div>
      </form>

      <aside className="grid gap-6 self-start">
        <SectionCard
          title="Atama Kuralı"
          description="MVP modelinde her ders grubunun bir atanmış öğretmeni vardır."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Info className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Ders / Kurs
              </span>
              <StatusBadge
                label={String(options.courses.length)}
                tone={hasCourses ? "success" : "warning"}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Öğretmen
              </span>
              <StatusBadge
                label={String(options.instructors.length)}
                tone={hasInstructors ? "success" : "warning"}
              />
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-600">
            Bir öğrenci birden fazla ders grubuna kayıt edilerek birden fazla
            öğretmenin derslerine bağlanabilir.
          </p>
        </SectionCard>
      </aside>
    </section>
  );
}
