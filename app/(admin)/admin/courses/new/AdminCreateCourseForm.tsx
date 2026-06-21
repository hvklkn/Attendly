"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { BookOpen, CheckCircle2, Info } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/SectionCard";
import { routes } from "@/constants/routes";
import { createAdminCourseAction } from "@/lib/admin/course-actions";
import {
  initialAdminCourseCreateActionState,
  type AdminCourseCreateActionState,
  type AdminCourseCreateFormErrors,
  type AdminCourseCreateFormField,
  type AdminCourseCreateFormValues,
} from "@/lib/admin/course-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

function getFieldError(
  errors: AdminCourseCreateFormErrors,
  field: AdminCourseCreateFormField,
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

type CourseFormAction = (
  previousState: AdminCourseCreateActionState,
  formData: FormData,
) => Promise<AdminCourseCreateActionState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Kaydediliyor..." : label}
    </button>
  );
}

export function AdminCreateCourseForm({
  action,
  initialValues,
  courseId,
  submitLabel = "Ders / Kurs Oluştur",
}: {
  action?: CourseFormAction;
  initialValues?: AdminCourseCreateFormValues;
  courseId?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(
    action ?? createAdminCourseAction,
    initialValues
      ? {
          ...initialAdminCourseCreateActionState,
          values: initialValues,
        }
      : initialAdminCourseCreateActionState,
  );
  const { values, errors } = state;

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={formAction} className="grid gap-6">
        {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.message}
          </div>
        ) : null}

        <SectionCard
          title="Ders / Kurs Bilgileri"
          description="Kurumunuzda kullanılacak ders veya kurs kaydını oluşturun."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              id="title"
              label="Ders / Kurs Adı"
              error={getFieldError(errors, "title")}
            >
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Veri Yapıları"
                defaultValue={values.title}
                aria-invalid={Boolean(getFieldError(errors, "title"))}
                aria-describedby={
                  getFieldError(errors, "title") ? "title-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="code"
              label="Kod"
              description="Kod kurum içinde benzersiz olmalıdır."
              error={getFieldError(errors, "code")}
            >
              <input
                id="code"
                name="code"
                type="text"
                required
                placeholder="BIL101"
                defaultValue={values.code}
                aria-invalid={Boolean(getFieldError(errors, "code"))}
                aria-describedby={
                  getFieldError(errors, "code") ? "code-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                id="description"
                label="Açıklama"
                error={getFieldError(errors, "description")}
              >
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="İsteğe bağlı açıklama"
                  defaultValue={values.description}
                  aria-invalid={Boolean(getFieldError(errors, "description"))}
                  aria-describedby={
                    getFieldError(errors, "description")
                      ? "description-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Durum"
          description="Pasif dersler yeni ders grubu ve yoklama oturumu oluşturma listelerinde kullanılmaz."
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
                İşaret kaldırılırsa bu ders / kurs Pasif olarak saklanır.
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
              Ders / kurs yalnızca mevcut kurum içinde oluşturulur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.admin.courses}>İptal</ButtonLink>
            <SubmitButton label={submitLabel} />
          </div>
        </div>
      </form>

      <aside className="grid gap-6 self-start">
        <SectionCard
          title="Kurum Kataloğu"
          description="Ders grubu oluşturmak için önce bir aktif ders / kurs gerekir."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Info className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <p className="text-sm leading-6 text-neutral-600">
            Kod ve ad bilgisi ders gruplarında, yoklama oturumlarında ve
            raporlarda görünür.
          </p>
        </SectionCard>
      </aside>
    </section>
  );
}
