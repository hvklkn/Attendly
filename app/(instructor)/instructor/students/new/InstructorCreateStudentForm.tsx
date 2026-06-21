"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  BookOpen,
  CheckCircle2,
  Info,
  KeyRound,
  Mail,
  UserRound,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { createInstructorStudentAction } from "@/lib/instructor/student-actions";
import {
  initialInstructorStudentCreateActionState,
  INSTRUCTOR_STUDENT_PASSWORD_MIN_LENGTH,
  type InstructorStudentCreateFormErrors,
  type InstructorStudentCreateFormField,
  type InstructorStudentCreateOptionsData,
} from "@/lib/instructor/student-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

function getFieldError(
  errors: InstructorStudentCreateFormErrors,
  field: InstructorStudentCreateFormField,
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
      {pending ? "Kaydediliyor..." : "Kaydet"}
    </button>
  );
}

function formatSection(
  section: InstructorStudentCreateOptionsData["sections"][number],
) {
  const sectionName = section.code
    ? `${section.code} · ${section.name}`
    : section.name;

  return `${section.course.code} · ${sectionName} · ${section._count.enrollments} kayıtlı`;
}

export function InstructorCreateStudentForm({
  options,
}: {
  options: InstructorStudentCreateOptionsData;
}) {
  const [state, formAction] = useActionState(
    createInstructorStudentAction,
    initialInstructorStudentCreateActionState,
  );
  const { values, errors } = state;
  const hasSections = options.sections.length > 0;

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

        {!hasSections ? (
          <SectionCard
            title="Ders grubu yok"
            description="Öğrenci eklemek için size atanmış aktif bir ders grubu gerekir."
          >
            <EmptyState
              title="Bu öğretmene ait ders grubu bulunamadı"
              description="Kurum yöneticiniz ders grubu ataması yaptığında öğrenci ekleyebilirsiniz."
              icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          </SectionCard>
        ) : null}

        <SectionCard
          title="Öğrenci Bilgileri"
          description="Öğrenci hesabı ve ders grubu kaydı aynı sunucu işleminde oluşturulur."
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
                placeholder="Zeynep Demir"
                defaultValue={values.name}
                disabled={!hasSections}
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
                placeholder="zeynep@example.com"
                defaultValue={values.email}
                disabled={!hasSections}
                aria-invalid={Boolean(getFieldError(errors, "email"))}
                aria-describedby={
                  getFieldError(errors, "email") ? "email-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="password"
              label="Şifre"
              description="Geçici şifreyi güvenli bir kanaldan öğrenciyle paylaşın."
              error={getFieldError(errors, "password")}
            >
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={INSTRUCTOR_STUDENT_PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                placeholder="En az 8 karakter"
                defaultValue={values.password}
                disabled={!hasSections}
                aria-invalid={Boolean(getFieldError(errors, "password"))}
                aria-describedby={
                  getFieldError(errors, "password")
                    ? "password-error"
                    : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="section-id"
              label="Ders Grubu"
              description="Yalnızca öğretmeni olduğunuz ders grupları listelenir."
              error={getFieldError(errors, "sectionId")}
            >
              <select
                id="section-id"
                name="sectionId"
                required
                defaultValue={values.sectionId}
                disabled={!hasSections}
                aria-invalid={Boolean(getFieldError(errors, "sectionId"))}
                aria-describedby={
                  getFieldError(errors, "sectionId")
                    ? "section-id-error"
                    : undefined
                }
                className={selectClassName}
              >
                <option value="" disabled>
                  Ders grubu seçin
                </option>
                {options.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {formatSection(section)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-950">
              Kaydetmeye hazır
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Kayıt yalnızca seçtiğiniz ders grubu ve mevcut kurum için
              oluşturulur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.instructor.students}>İptal</ButtonLink>
            <SubmitButton disabled={!hasSections} />
          </div>
        </div>
      </form>

      <aside className="grid gap-6 self-start">
        <SectionCard
          title="Yetki Kapsamı"
          description="Öğretmenler yalnızca öğrenci hesabı oluşturabilir ve kendi ders gruplarına kayıt yapabilir."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Öğrenci
              </span>
              <StatusBadge label="Eklenebilir" tone="success" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Öğretmen
              </span>
              <StatusBadge label="Yetki yok" tone="neutral" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">
                Kurum Yöneticisi
              </span>
              <StatusBadge label="Yetki yok" tone="neutral" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Güvenlik Notları">
          <div className="space-y-4 text-sm leading-6 text-neutral-600">
            <div className="flex gap-3">
              <BookOpen className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>
                Ders grubu sahipliği sunucuda öğretmen üyeliğinizle doğrulanır.
              </p>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>Başka kurumdaki e-posta adresleri öğretmene açıklanmaz.</p>
            </div>
            <div className="flex gap-3">
              <KeyRound className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>Şifre yalnızca hash olarak saklanır.</p>
            </div>
            <div className="flex gap-3">
              <Info className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
              <p>
                Çoklu öğrenci eklemek için öğrenciler sayfasındaki CSV aktarımını
                kullanabilirsiniz.
              </p>
            </div>
          </div>
        </SectionCard>
      </aside>
    </section>
  );
}
