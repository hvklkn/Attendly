"use client";

import { useActionState, useMemo, useState } from "react";
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
import { routes } from "@/constants/routes";
import { createAdminSessionAction } from "@/lib/admin/session-actions";
import {
  GEOFENCE_RADIUS_METERS_DEFAULT,
  GEOFENCE_RADIUS_METERS_MAX,
  GEOFENCE_RADIUS_METERS_MIN,
  initialCreateSessionActionState,
  LATE_THRESHOLD_MINUTES_MAX,
  LATE_THRESHOLD_MINUTES_MIN,
  type AdminSessionCreateOptionsData,
  type CreateSessionFormErrors,
  type CreateSessionFormField,
} from "@/lib/admin/session-create";
import { AttendanceSessionGeofenceSource } from "@/lib/generated/prisma/enums";
import { getRoleLabel } from "@/lib/localization";

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
      {pending ? "Oluşturuluyor..." : "Yoklama Oturumu Oluştur"}
    </button>
  );
}

function formatPerson(user: { name: string | null; email: string }) {
  return user.name ? `${user.name} · ${user.email}` : user.email;
}

function getGeofenceError(errors: CreateSessionFormErrors) {
  return (
    errors.geofenceLatitude ??
    errors.geofenceLongitude ??
    errors.geofenceAccuracyMeters ??
    errors.geofenceRadiusMeters ??
    errors.geofenceSource
  );
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
  const hasResponsibleCandidates = options.responsibleCandidates.length > 0;
  const hasRequiredData = hasCourses && hasSections;
  const { values, errors } = state;
  const [selectedInstructorMembershipId, setSelectedInstructorMembershipId] =
    useState(values.instructorMembershipId);
  const [selectedCourseId, setSelectedCourseId] = useState(values.courseId);
  const [selectedSectionId, setSelectedSectionId] = useState(values.sectionId);
  const [geofenceLocation, setGeofenceLocation] = useState({
    latitude: values.geofenceLatitude,
    longitude: values.geofenceLongitude,
    accuracyMeters: values.geofenceAccuracyMeters,
    source: values.geofenceSource || AttendanceSessionGeofenceSource.NONE,
  });
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const hasCapturedLocation = Boolean(
    geofenceLocation.latitude && geofenceLocation.longitude,
  );
  const geofenceError = getGeofenceError(errors);
  const filteredSections = useMemo(
    () =>
      options.sections.filter((section) => {
        const matchesCourse =
          !selectedCourseId || section.courseId === selectedCourseId;
        const matchesInstructor =
          !selectedInstructorMembershipId ||
          section.instructorAssignments.some(
            (assignment) =>
              assignment.instructorMembership.id ===
              selectedInstructorMembershipId,
          );

        return matchesCourse && matchesInstructor;
      }),
    [options.sections, selectedCourseId, selectedInstructorMembershipId],
  );
  const selectedSection =
    options.sections.find((section) => section.id === selectedSectionId) ??
    null;
  const assignedResponsibleLabel = selectedSection?.instructorAssignments.length
    ? selectedSection.instructorAssignments
        .map((assignment) => formatPerson(assignment.instructorMembership.user))
        .join(", ")
    : selectedSection
      ? "Öğretmen henüz atanmadı"
      : "Ders grubu seçildiğinde görünür";

  function captureDeviceLocation() {
    setLocationMessage(null);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tarayıcınız konum almayı desteklemiyor.");
      return;
    }

    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeofenceLocation({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracyMeters: position.coords.accuracy.toFixed(1),
          source: AttendanceSessionGeofenceSource.DEVICE,
        });
        setLocationMessage("Konum alındı.");
        setIsCapturingLocation(false);
      },
      () => {
        setLocationError(
          "Konum alınamadı. Lütfen tarayıcı iznini kontrol edip tekrar deneyin.",
        );
        setIsCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }

  return (
    <>
      {!hasRequiredData ? (
        <SectionCard
          title="Ön koşullar eksik"
          description="Oturum oluşturmak için aktif ders / kurs ve ders grubu gerekir."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {!hasCourses ? (
              <EmptyState
                title="Aktif ders yok"
                description="Yoklama oturumu oluşturmadan önce bir ders / kurs oluşturun."
                icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
                actionHref={routes.admin.courseCreate}
                actionLabel="Önce bir ders / kurs oluşturun"
                className="min-h-40"
              />
            ) : null}
            {!hasSections ? (
              <EmptyState
                title="Aktif ders grubu yok"
                description="Yoklama oturumu oluşturmadan önce en az bir ders grubunu aktif hale getirin."
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                actionHref={routes.admin.sectionCreate}
                actionLabel="Ders Grubu Oluştur"
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
            description="Oturumun bağlı olduğu öğretmen, ders ve ders grubunu seçin."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                id="instructor-membership-id"
                label="Öğretmen"
                description="Seçilen öğretmene atanmış ders grupları listelenir."
                error={getFieldError(errors, "instructorMembershipId")}
              >
                <select
                  id="instructor-membership-id"
                  name="instructorMembershipId"
                  disabled={!hasResponsibleCandidates}
                  value={selectedInstructorMembershipId}
                  onChange={(event) => {
                    setSelectedInstructorMembershipId(event.target.value);
                    setSelectedSectionId("");
                  }}
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
                  <option value="">
                    {hasResponsibleCandidates
                      ? "Tüm öğretmenler"
                      : "Öğretmen yok"}
                  </option>
                  {options.responsibleCandidates.map((membership) => (
                    <option key={membership.id} value={membership.id}>
                      {formatPerson(membership.user)} ·{" "}
                      {getRoleLabel(membership.role)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="course-id"
                label="Ders / Kurs"
                description="Ders grubu seçimi sunucuda ders ile eşleştirilir."
                error={getFieldError(errors, "courseId")}
              >
                <select
                  id="course-id"
                  name="courseId"
                  required
                  disabled={!hasCourses}
                  value={selectedCourseId}
                  onChange={(event) => {
                    setSelectedCourseId(event.target.value);
                    setSelectedSectionId("");
                  }}
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
                id="section-id"
                label="Ders Grubu"
                description="Seçilen ders grubu aktif öğretmen ataması üzerinden doğrulanır."
                error={getFieldError(errors, "sectionId")}
              >
                <select
                  id="section-id"
                  name="sectionId"
                  required
                  disabled={!hasSections}
                  value={selectedSectionId}
                  onChange={(event) => {
                    setSelectedSectionId(event.target.value);
                  }}
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
                  {filteredSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.course.code} · {section.name} ·{" "}
                      {section.instructorAssignments.length
                        ? section.instructorAssignments
                            .map((assignment) =>
                              formatPerson(
                                assignment.instructorMembership.user,
                              ),
                            )
                            .join(", ")
                        : "Öğretmen henüz atanmadı"}{" "}
                      · {section._count.enrollments} kayıtlı
                    </option>
                  ))}
                </select>
              </Field>

              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-medium text-neutral-700">
                  Atanmış Öğretmenler
                </p>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {assignedResponsibleLabel}
                </p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Öğretmenler yalnızca kendilerine atanmış şubelerdeki
                  oturumları yönetebilir.
                </p>
                {filteredSections.length === 0 ? (
                  <p className="mt-3 text-xs leading-5 text-amber-700">
                    Bu öğretmene atanmış ders grubu bulunamadı.
                  </p>
                ) : null}
              </div>
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
            title="Konum Doğrulama Alanı"
            description="Öğrencilerin yoklamaya katılabilmesi için bu alanın içinde olması gerekir."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            <div className="grid gap-5">
              <input
                type="hidden"
                name="geofenceLatitude"
                value={geofenceLocation.latitude}
              />
              <input
                type="hidden"
                name="geofenceLongitude"
                value={geofenceLocation.longitude}
              />
              <input
                type="hidden"
                name="geofenceAccuracyMeters"
                value={geofenceLocation.accuracyMeters}
              />
              <input
                type="hidden"
                name="geofenceSource"
                value={geofenceLocation.source}
              />

              <Field
                id="room-id"
                label="Oda"
                description="Oda seçimi isteğe bağlıdır; yoklama alanının merkezi cihaz konumundan alınır."
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

              <div className="grid gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Cihaz Konumumu Al
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Konum izni yalnızca butona bastığınızda istenir. Alınan
                    merkez konum bu oturumun yoklama alanı olarak saklanır.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasCapturedLocation ? (
                      <StatusBadge label="Konum alındı" tone="success" />
                    ) : (
                      <StatusBadge label="Konum bekleniyor" tone="warning" />
                    )}
                    {geofenceLocation.accuracyMeters ? (
                      <StatusBadge
                        label={`Doğruluk: ${Math.round(
                          Number(geofenceLocation.accuracyMeters),
                        )} m`}
                        tone="info"
                      />
                    ) : null}
                  </div>
                  {locationMessage ? (
                    <p className="mt-3 text-sm text-emerald-700">
                      {locationMessage}
                    </p>
                  ) : null}
                  {locationError ? (
                    <p className="mt-3 text-sm text-rose-700">
                      {locationError}
                    </p>
                  ) : null}
                  {geofenceError ? (
                    <p className="mt-3 text-sm text-rose-700">
                      {geofenceError}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isCapturingLocation || !hasRequiredData}
                  onClick={captureDeviceLocation}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {isCapturingLocation
                    ? "Konum alınıyor..."
                    : "İzin Ver ve Konumu Al"}
                </button>
              </div>

              {hasCapturedLocation ? (
                <div className="rounded-md border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-medium text-neutral-900">
                    Merkez Konum
                  </p>
                  <p className="mt-2 break-all text-sm text-neutral-600">
                    {geofenceLocation.latitude}, {geofenceLocation.longitude}
                  </p>
                </div>
              ) : null}

              <Field
                id="geofence-radius-meters"
                label="Yoklama alanı yarıçapı"
                description={`${GEOFENCE_RADIUS_METERS_MIN} ile ${GEOFENCE_RADIUS_METERS_MAX} metre arasında bir değer kullanın. Varsayılan ${GEOFENCE_RADIUS_METERS_DEFAULT} metredir.`}
                error={getFieldError(errors, "geofenceRadiusMeters")}
              >
                <input
                  id="geofence-radius-meters"
                  name="geofenceRadiusMeters"
                  type="number"
                  min={GEOFENCE_RADIUS_METERS_MIN}
                  max={GEOFENCE_RADIUS_METERS_MAX}
                  step="1"
                  list="geofence-radius-options"
                  defaultValue={values.geofenceRadiusMeters}
                  disabled={!hasRequiredData}
                  aria-invalid={Boolean(
                    getFieldError(errors, "geofenceRadiusMeters"),
                  )}
                  aria-describedby={
                    getFieldError(errors, "geofenceRadiusMeters")
                      ? "geofence-radius-meters-error"
                      : undefined
                  }
                  className={inputClassName}
                />
                <datalist id="geofence-radius-options">
                  <option value="25" label="25 m" />
                  <option value="50" label="50 m" />
                  <option value="100" label="100 m" />
                  <option value="150" label="150 m" />
                </datalist>
              </Field>

              <label className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                <input
                  name="allowWithoutGeofence"
                  type="checkbox"
                  defaultChecked={values.allowWithoutGeofence === "on"}
                  className="mt-1 h-4 w-4 rounded border-amber-300 text-neutral-950 focus:ring-amber-500"
                />
                <span>
                  <span className="block text-sm font-medium text-amber-950">
                    Konum doğrulamasız oluştur
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-amber-900">
                    Konum doğrulaması olmayan oturumlarda öğrencinin sınıfta
                    olup olmadığı kontrol edilemez.
                  </span>
                </span>
              </label>

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
                  Ders Grupları
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
                  label={String(options.responsibleCandidates.length)}
                  tone={hasResponsibleCandidates ? "success" : "neutral"}
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
                <p>Ders grubu sahipliği bu kurum üzerinden kontrol edilir.</p>
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
