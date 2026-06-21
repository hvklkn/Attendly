"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/SectionCard";
import { routes } from "@/constants/routes";
import { updateInstructorStudentAction } from "@/lib/instructor/student-actions";
import {
  initialInstructorStudentEditActionState,
  type InstructorStudentEditFormErrors,
  type InstructorStudentEditFormField,
  type InstructorStudentEditFormValues,
} from "@/lib/instructor/student-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

function getFieldError(
  errors: InstructorStudentEditFormErrors,
  field: InstructorStudentEditFormField,
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
      {pending ? "Kaydediliyor..." : "Öğrenciyi Güncelle"}
    </button>
  );
}

export function InstructorEditStudentForm({
  studentMembershipId,
  email,
  initialValues,
}: {
  studentMembershipId: string;
  email: string;
  initialValues: InstructorStudentEditFormValues;
}) {
  const [state, formAction] = useActionState(updateInstructorStudentAction, {
    ...initialInstructorStudentEditActionState,
    values: initialValues,
  });
  const { values, errors } = state;

  return (
    <form action={formAction} className="grid gap-6">
      <input
        type="hidden"
        name="studentMembershipId"
        value={studentMembershipId}
      />
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {state.message}
        </div>
      ) : null}

      <SectionCard
        title="Öğrenci Bilgileri"
        description="Öğretmenler yalnızca ad soyad ve öğrenci numarasını düzenleyebilir."
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
            id="studentNo"
            label="Öğrenci Numarası"
            error={getFieldError(errors, "studentNo")}
          >
            <input
              id="studentNo"
              name="studentNo"
              type="text"
              defaultValue={values.studentNo}
              className={inputClassName}
            />
          </Field>

          <Field
            id="email"
            label="E-posta"
            description="E-posta yalnızca admin tarafından değiştirilebilir."
          >
            <input
              id="email"
              value={email}
              readOnly
              className={inputClassName}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            Kaydetmeye hazır
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Section kayıtlarını pasifleştirme öğrenci listesinde yapılır.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={routes.instructor.students}>İptal</ButtonLink>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
