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
      {pending ? "Creating..." : "Create session"}
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
          title="Prerequisites needed"
          description="A session must be attached to an active section before it can be created."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {!hasCourses ? (
              <EmptyState
                title="No active courses"
                description="Create or activate at least one course before building attendance sessions."
                icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
                className="min-h-40"
              />
            ) : null}
            {!hasSections ? (
              <EmptyState
                title="No active sections"
                description="Create or activate at least one section so attendance sessions have a roster context."
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
            title="Basic information"
            description="High-level details that identify the attendance window."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5">
              <Field
                id="session-title"
                label="Title"
                error={getFieldError(errors, "title")}
              >
                <input
                  id="session-title"
                  name="title"
                  type="text"
                  required
                  placeholder="Data Structures Lab"
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
              <Field id="session-description" label="Description">
                <textarea
                  id="session-description"
                  name="description"
                  rows={4}
                  placeholder="Optional note for administrators and instructors"
                  disabled={!hasRequiredData}
                  defaultValue={values.description}
                  className={inputClassName}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Academic relation"
            description="Select the course context and the section that owns this session."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                id="course-id"
                label="Course"
                description="The selected section remains the authoritative relation in the current schema."
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
                    Select a course
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
                label="Section"
                description="The create mutation validates that the section belongs to this organization."
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
                    Select a section
                  </option>
                  {options.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.course.code} · {section.name} ·{" "}
                      {section._count.enrollments} enrolled
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="instructor-membership-id"
                label="Instructor"
                description="Sections already carry instructor assignment; this field is staged for future validation and review."
              >
                <select
                  id="instructor-membership-id"
                  disabled={!hasInstructors}
                  defaultValue=""
                  className={selectClassName}
                >
                  <option value="">
                    {hasInstructors ? "Use section instructor" : "No instructors"}
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
            title="Schedule"
            description="Timing fields are validated on the server before the session is created."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                id="start-time"
                label="Start time"
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
                label="End time"
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
                label="Late threshold"
                description="Stored in minutes on the attendance session."
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
            title="Location"
            description="Rooms are optional in the schema, but choosing one prepares location-aware attendance checks later."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5">
              <Field
                id="room-id"
                label="Room"
                description="Allowed radius and room metadata will be used by future check-in validation."
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
                    {hasRooms ? "No room selected" : "No active rooms"}
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
                  title="No active rooms"
                  description="Room selection is optional for the current schema. Room records can be added later for location-aware attendance."
                  icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                  className="min-h-36"
                />
              ) : null}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-950">
                Ready to create
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                The server will validate the form and create a session in this
                organization.
              </p>
            </div>
            <SubmitButton disabled={!hasRequiredData} />
          </div>
        </form>

        <aside className="grid gap-6 self-start">
          <SectionCard
            title="Readiness"
            description="Live prerequisite data for this organization."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <Info className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Courses
                </span>
                <StatusBadge
                  label={String(options.courses.length)}
                  tone={hasCourses ? "success" : "warning"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Sections
                </span>
                <StatusBadge
                  label={String(options.sections.length)}
                  tone={hasSections ? "success" : "warning"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Rooms
                </span>
                <StatusBadge
                  label={String(options.rooms.length)}
                  tone={hasRooms ? "success" : "neutral"}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-700">
                  Instructors
                </span>
                <StatusBadge
                  label={String(options.instructors.length)}
                  tone={hasInstructors ? "success" : "neutral"}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Mutation checks"
            description="What the server verifies before persistence."
          >
            <div className="space-y-4 text-sm leading-6 text-neutral-600">
              <div className="flex gap-3">
                <Clock3 className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Start time must be before end time.</p>
              </div>
              <div className="flex gap-3">
                <BookOpen className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Section ownership is checked against this organization.</p>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                <p>Room is optional and only attached after ownership checks.</p>
              </div>
            </div>
          </SectionCard>
        </aside>
      </section>
    </>
  );
}
