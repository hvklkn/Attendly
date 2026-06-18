"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { BookOpen, CalendarClock, ClipboardCheck, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createInstructorAttendanceSessionAction } from "@/lib/instructor/session-actions";
import {
  INSTRUCTOR_SESSION_RADIUS_METERS_DEFAULT,
  INSTRUCTOR_SESSION_RADIUS_METERS_MAX,
  INSTRUCTOR_SESSION_RADIUS_METERS_MIN,
  initialInstructorCreateSessionActionState,
  type InstructorCreateSessionFormErrors,
  type InstructorCreateSessionFormField,
  type InstructorCreateSessionFormValues,
  type InstructorSessionCreateOptionsData,
} from "@/lib/instructor/session-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

function getFieldError(
  errors: InstructorCreateSessionFormErrors,
  field: InstructorCreateSessionFormField,
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
      className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Oluşturuluyor..." : "Yoklama Oturumu Oluştur"}
    </button>
  );
}

function hasRoomCoordinates(
  room: InstructorSessionCreateOptionsData["rooms"][number] | null,
) {
  return Boolean(room?.latitude && room.longitude);
}

function formatRoomLabel(
  room: InstructorSessionCreateOptionsData["rooms"][number],
) {
  const code = room.code ? `${room.code} - ` : "";
  const radius = room.allowedRadiusMeters
    ? ` - ${room.allowedRadiusMeters} m`
    : "";
  const coordinates = hasRoomCoordinates(room) ? " - koordinat var" : "";

  return `${code}${room.name}${radius}${coordinates}`;
}

function formatSectionLabel(
  section: InstructorSessionCreateOptionsData["sections"][number],
) {
  const sectionCode = section.code ?? `${section.course.code}-${section.name}`;

  return `${sectionCode} (${section._count.enrollments} öğrenci)`;
}

export function InstructorCreateSessionForm({
  options,
  defaultValues,
}: {
  options: InstructorSessionCreateOptionsData;
  defaultValues: InstructorCreateSessionFormValues;
}) {
  const initialState = useMemo(
    () => ({
      ...initialInstructorCreateSessionActionState,
      values: defaultValues,
    }),
    [defaultValues],
  );
  const [state, formAction] = useActionState(
    createInstructorAttendanceSessionAction,
    initialState,
  );
  const { values, errors } = state;
  const [selectedSectionId, setSelectedSectionId] = useState(values.sectionId);
  const [selectedRoomId, setSelectedRoomId] = useState(values.roomId);
  const [geofenceLocation, setGeofenceLocation] = useState({
    latitude: values.geofenceLatitude,
    longitude: values.geofenceLongitude,
    accuracyMeters: values.geofenceAccuracyMeters,
  });
  const [locationMessage, setLocationMessage] = useState<string | null>(
    values.geofenceLatitude && values.geofenceLongitude
      ? `Konum alındı: ${values.geofenceLatitude}, ${values.geofenceLongitude}, doğruluk: ${values.geofenceAccuracyMeters || "belirtilmedi"} metre`
      : null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const hasSections = options.sections.length > 0;
  const selectedSection =
    options.sections.find((section) => section.id === selectedSectionId) ??
    null;
  const selectedRoom =
    options.rooms.find((room) => room.id === selectedRoomId) ?? null;
  const geofenceError =
    getFieldError(errors, "geofenceLatitude") ??
    getFieldError(errors, "geofenceLongitude") ??
    getFieldError(errors, "geofenceAccuracyMeters");

  function captureCurrentLocation() {
    setLocationMessage(null);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tarayıcınız konum almayı desteklemiyor.");
      return;
    }

    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const accuracyMeters = Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy.toFixed(1)
          : "";

        setGeofenceLocation({
          latitude,
          longitude,
          accuracyMeters,
        });
        setLocationMessage(
          `Konum alındı: ${latitude}, ${longitude}, doğruluk: ${
            accuracyMeters || "belirtilmedi"
          } metre`,
        );
        setIsCapturingLocation(false);
      },
      () => {
        setLocationError(
          "Konum alınamadı. Tarayıcı iznini kontrol edip tekrar deneyin.",
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

  if (!hasSections) {
    return (
      <SectionCard
        title="Ders grubu bulunamadı"
        description="Yeni yoklama oluşturmak için size atanmış aktif bir ders grubu gerekir."
      >
        <EmptyState
          title="Atanmış ders grubunuz yok"
          description="Kurum yöneticiniz sizi bir ders grubuna atadığında burada yeni yoklama oluşturabilirsiniz."
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          className="min-h-56"
        />
      </SectionCard>
    );
  }

  return (
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
        title="Oturum Bilgileri"
        description="Yeni yoklama aktif olarak oluşturulur ve başarıyla kaydedilince QR paneline yönlenir."
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
              defaultValue={values.title}
              placeholder="Canlı Yoklama"
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
              rows={3}
              defaultValue={values.description}
              placeholder="İsteğe bağlı oturum notu"
              className={inputClassName}
            />
          </Field>
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SectionCard
          title="Ders ve Zaman"
          description="Yoklama hangi ders grubu için ve hangi aralıkta aktif olacak?"
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-5">
            <Field
              id="section-id"
              label="Section"
              error={getFieldError(errors, "sectionId")}
            >
              <select
                id="section-id"
                name="sectionId"
                required
                value={selectedSectionId}
                onChange={(event) => setSelectedSectionId(event.target.value)}
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
                    {formatSectionLabel(section)}
                  </option>
                ))}
              </select>
            </Field>

            {selectedSection?._count.enrollments === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Bu şubede aktif öğrenci bulunmuyor.
              </p>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
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
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Konum Kaynağı"
          description="Öncelik mevcut eğitmen konumu; alınmazsa seçilen odanın koordinatı kullanılır."
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

            <Field
              id="room-id"
              label="Room"
              description="Konum alınmazsa bu odanın koordinatı kullanılacak."
              error={getFieldError(errors, "roomId")}
            >
              <select
                id="room-id"
                name="roomId"
                value={selectedRoomId}
                onChange={(event) => setSelectedRoomId(event.target.value)}
                aria-invalid={Boolean(getFieldError(errors, "roomId"))}
                aria-describedby={
                  getFieldError(errors, "roomId") ? "room-id-error" : undefined
                }
                className={selectClassName}
              >
                <option value="">Oda seçin</option>
                {options.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {formatRoomLabel(room)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="geofence-radius-meters"
              label="Geofence radius metre"
              description={`Varsayılan ${INSTRUCTOR_SESSION_RADIUS_METERS_DEFAULT} metredir.`}
              error={getFieldError(errors, "geofenceRadiusMeters")}
            >
              <input
                id="geofence-radius-meters"
                name="geofenceRadiusMeters"
                type="number"
                min={INSTRUCTOR_SESSION_RADIUS_METERS_MIN}
                max={INSTRUCTOR_SESSION_RADIUS_METERS_MAX}
                step="1"
                defaultValue={values.geofenceRadiusMeters}
                className={inputClassName}
              />
            </Field>

            <button
              type="button"
              onClick={captureCurrentLocation}
              disabled={isCapturingLocation}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {isCapturingLocation
                ? "Konum alınıyor..."
                : "Mevcut konumumu kullan"}
            </button>

            {locationMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {locationMessage}
              </p>
            ) : (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Konum alınmadı, oda konumu kullanılacak.
              </p>
            )}

            {locationError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {locationError}
              </p>
            ) : null}

            {geofenceError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {geofenceError}
              </p>
            ) : null}

            {selectedRoom ? (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
                <p className="font-medium text-neutral-900">
                  {selectedRoom.name}
                </p>
                <p>{selectedRoom.address ?? "Adres belirtilmedi"}</p>
                {hasRoomCoordinates(selectedRoom) ? (
                  <p>
                    Oda koordinatı: {selectedRoom.latitude},{" "}
                    {selectedRoom.longitude}
                  </p>
                ) : (
                  <p className="text-amber-700">
                    Bu odada koordinat yok. Konum almazsanız oturum
                    oluşturulamaz.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-950">
            Status: ACTIVE
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Oturum oluşturulduktan sonra QR paneli açılır.
          </p>
        </div>
        <SubmitButton disabled={!hasSections} />
      </div>
    </form>
  );
}
