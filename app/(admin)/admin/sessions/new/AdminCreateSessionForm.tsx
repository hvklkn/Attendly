"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Info,
  MapPin,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createAdminSessionAction } from "@/lib/admin/session-actions";
import {
  initialCreateSessionActionState,
  LATE_THRESHOLD_MINUTES_MAX,
  LATE_THRESHOLD_MINUTES_MIN,
  type AdminSessionCreateOptionsData,
  type CreateSessionFormErrors,
  type CreateSessionFormField,
} from "@/lib/admin/session-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

function getFieldError(
  errors: CreateSessionFormErrors,
  field: CreateSessionFormField,
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
  children: React.ReactNode;
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
      {pending ? "Oluşturuluyor..." : "Oturum Oluştur"}
    </button>
  );
}

function formatPerson(user: { name: string | null; email: string }) {
  return user.name ? `${user.name} · ${user.email}` : user.email;
}

export function AdminCreateSessionForm({
  options,
}: {
  options: AdminSessionCreateOptionsData;
}) {
  const [state, formAction] = useActionState(
    createAdminSessionAction,
    initialCreateSessionActionState,
  );

  const hasCourses = options.courses.length > 0;
  const hasSections = options.sections.length > 0;
  const hasRooms = options.rooms.length > 0;
  const hasInstructors = options.instructors.length > 0;
  const hasRequiredData = hasCourses && hasSections;
  const { values, errors } = state;

  return (
    <>
      {!hasRequiredData ? (
        <SectionCard
          title="Ön koşullar eksik"
          description="Oturum oluşturmak için aktif bir şube gerekir."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {!hasCourses ? (
              <EmptyState
                title="Aktif ders yok"
                description="Yoklama oturumu oluşturmadan önce en az bir dersi aktif hale getirin."
                icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            ) : null}
            {!hasSections ? (
              <EmptyState
                title="Aktif şube yok"
                description="Yoklama oturumlarının liste bağlamı olması için en az bir şubeyi aktif hale getirin."
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            ) : null}
          </div>
        </SectionCard>
      ) : null}

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
            title="Temel Bilgiler"
            description="Yoklama zaman aralığını tanımlayan bilgiler."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5">
              <Field
                id="session-title"
                label="Başlık"
                error={getFieldError(errors, "title")}
              >
                <input
                  id="session-title"
                  name="title"
                  type="text"
                  required
                  placeholder="Veri Yapıları Laboratuvarı"
                  disabled={!hasRequiredData}
                  defaultValue={values.title}
                  aria-invalid={Boolean(getFieldError(errors, "title"))}
                  aria-describedby={
                    getFieldError(errors, "title")
                      ? "session-title-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
              <Field id="session-description" label="Açıklama">
                <textarea
                  id="session-description"
                  name="description"
                  rows={4}
                  placeholder="Yönetici ve öğretmenler için isteğe bağlı not"
                  disabled={!hasRequiredData}
                  defaultValue={values.description}
                  className={inputClassName}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Ders İlişkisi"
            description="Oturumun bağlı olduğu ders ve şubeyi seçin."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                id="course-id"
                label="Ders"
                description="Geçerli şemada şube, oturumun asıl ilişkisidir."
                error={getFieldError(errors, "courseId")}
              >
                <select
                  id="course-id"
                  name="courseId"
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
                    Ders seçin
                  </option>
                  {options.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="section-id"
                label="Şube"
                description="Oluşturma işlemi şubenin bu kuruma ait olduğunu doğrular."
                error={getFieldError(errors, "sectionId")}
              >
                <select
                  id="section-id"
                  name="sectionId"
                  required
                  disabled={!hasSections}
                  defaultValue={values.sectionId}
                  aria-invalid={Boolean(getFieldError(errors, "sectionId"))}
                  aria-describedby={
                    getFieldError(errors, "sectionId")
                      ? "section-id-error"
                      : undefined
                  }
                  className={selectClassName}
                >
                  <option value="" disabled>
                    Şube seçin
                  </option>
                  {options.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.course.code} · {section.name} ·{" "}
                      {section._count.enrollments} kayıtlı
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="instructor-membership-id"
                label="Öğretmen"
                description="Şubeler öğretmen atamasını zaten taşır; bu alan ilerideki doğrulama için hazır tutulur."
              >
                <select
                  id="instructor-membership-id"
                  disabled={!hasInstructors}
                  defaultValue=""
                  className={selectClassName}
                >
                  <option value="">
                    {hasInstructors ? "Şube öğretmenini kullan" : "Öğretmen yok"}
                  </option>
                  {options.instructors.map((membership) => (
                    <option key={membership.id} value={membership.id}>
                      {formatPerson(membership.user)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Takvim"
            description="Zaman alanları oturum oluşturulmadan önce sunucuda doğrulanır."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                id="start-time"
                label="Başlangıç zamanı"
                error={getFieldError(errors, "startTime")}
              >
                <input
                  id="start-time"
                  name="startTime"
                  type="datetime-local"
                  required
                  disabled={!hasRequiredData}
                  defaultValue={values.startTime}
                  aria-invalid={Boolean(getFieldError(errors, "startTime"))}
                  aria-describedby={
                    getFieldError(errors, "startTime")
                      ? "start-time-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
              <Field
                id="end-time"
                label="Bitiş zamanı"
                error={getFieldError(errors, "endTime")}
              >
                <input
                  id="end-time"
                  name="endTime"
                  type="datetime-local"
                  required
                  disabled={!hasRequiredData}
                  defaultValue={values.endTime}
                  aria-invalid={Boolean(getFieldError(errors, "endTime"))}
                  aria-describedby={
                    getFieldError(errors, "endTime")
                      ? "end-time-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
              <Field
                id="late-threshold-minutes"
                label="Geç kalma eşiği"
                description="Yoklama oturumunda dakika cinsinden saklanır."
                error={getFieldError(errors, "lateThresholdMinutes")}
              >
                <input
                  id="late-threshold-minutes"
                  name="lateThresholdMinutes"
                  type="number"
                  min={LATE_THRESHOLD_MINUTES_MIN}
                  max={LATE_THRESHOLD_MINUTES_MAX}
                  step="1"
                  defaultValue={values.lateThresholdMinutes}
                  disabled={!hasRequiredData}
                  aria-invalid={Boolean(
                    getFieldError(errors, "lateThresholdMinutes"),
                  )}
                  aria-describedby={
                    getFieldError(errors, "lateThresholdMinutes")
                      ? "late-threshold-minutes-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Konum"
            description="Oda seçimi isteğe bağlıdır; seçildiğinde konum doğrulaması için temel hazırlar."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5">
              <Field
                id="room-id"
                label="Oda"
                description="Yarıçap ve oda bilgileri sonraki yoklama doğrulamasında kullanılacak."
                error={getFieldError(errors, "roomId")}
              >
                <select
                  id="room-id"
                  name="roomId"
                  disabled={!hasRooms}
                  defaultValue={values.roomId}
                  aria-invalid={Boolean(getFieldError(errors, "roomId"))}
                  aria-describedby={
                    getFieldError(errors, "roomId") ? "room-id-error" : undefined
                  }
                  className={selectClassName}
                >
                  <option value="">
                    {hasRooms ? "Oda seçilmedi" : "Aktif oda yok"}
                  </option>
                  {options.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.code ? `${room.code} · ` : ""}
                      {room.name}
                      {room.allowedRadiusMeters
                        ? ` · ${room.allowedRadiusMeters} m`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {!hasRooms ? (
                <EmptyState
                  title="Aktif oda yok"
                  description="Oda seçimi şu an isteğe bağlıdır. Konum bazlı yoklama için oda kayıtları daha sonra eklenebilir."
                  icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                  className="min-h-36"
                />
              ) : null}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Oluşturmaya hazır
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Sunucu formu doğrular ve bu kurum içinde oturumu oluşturur.
              </p>
            </div>
            <SubmitButton disabled={!hasRequiredData} />
          </div>
        </form>

        <aside className="grid gap-6 self-start">
          <SectionCard
            title="Hazırlık"
            description="Bu kurum için canlı ön koşul verileri."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <Info className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Dersler
                </span>
                <StatusBadge
                  label={String(options.courses.length)}
                  tone={hasCourses ? "success" : "warning"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Şubeler
                </span>
                <StatusBadge
                  label={String(options.sections.length)}
                  tone={hasSections ? "success" : "warning"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Odalar
                </span>
                <StatusBadge
                  label={String(options.rooms.length)}
                  tone={hasRooms ? "success" : "neutral"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Öğretmenler
                </span>
                <StatusBadge
                  label={String(options.instructors.length)}
                  tone={hasInstructors ? "success" : "neutral"}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Sunucu Kontrolleri"
            description="Kaydetmeden önce doğrulanan kurallar."
          >
            <div className="space-y-4 text-sm leading-6 text-neutral-600">
              <div className="flex gap-3">
                <Clock3 className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Başlangıç zamanı bitiş zamanından önce olmalıdır.</p>
              </div>
              <div className="flex gap-3">
                <BookOpen className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Şube sahipliği bu kurum üzerinden kontrol edilir.</p>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Oda isteğe bağlıdır ve sahiplik kontrolünden sonra bağlanır.</p>
              </div>
            </div>
          </SectionCard>
        </aside>
      </section>
    </>
  );
}
